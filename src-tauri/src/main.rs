// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use tauri::State;
use tauri_plugin_shell::ShellExt; // Importante para usar comandos no v2
use rodio::{OutputStream, Sink};

// --- SOLUÇÃO PARA O ERRO DE THREAD (Send + Sync) ---
// O OutputStream do Rodio não é Send por padrão. Criamos um wrapper.
struct RodioStream(#[allow(dead_code)] OutputStream);

// UNSAFE: Forçamos o Rust a aceitar enviar isso entre threads.
// Isso é necessário para guardar o stream no State do Tauri.
unsafe impl Send for RodioStream {}
unsafe impl Sync for RodioStream {}

// ---------------------------------------------------

struct PlayerState {
    // Usamos o wrapper RodioStream aqui em vez de OutputStream direto
    _stream: Arc<Mutex<Option<RodioStream>>>,
    sink: Arc<Mutex<Option<Sink>>>,
}

#[tauri::command]
async fn play_track(query: String, app: tauri::AppHandle, state: State<'_, PlayerState>) -> Result<String, String> {
    println!("Buscando: {}", query);

    // No Tauri v2, usamos o plugin shell assim:
    let output = app.shell()
        .command("binaries/ytdlp") // Caminho relativo configurado no tauri.conf.json
        .args(&[
            "-f", "bestaudio",
            "-g", 
            &query
        ])
        .output()
        .await
        .map_err(|e| format!("Falha ao executar ytdlp: {}", e))?;

    if !output.status.success() {
        return Err(format!("Erro no ytdlp: {:?}", String::from_utf8_lossy(&output.stderr)));
    }

    let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
    println!("URL Encontrada: {}", url);

    // Configurando o áudio
    // Precisamos recriar o stream e o sink a cada play ou reutilizar?
    // Aqui vamos recriar para garantir que pegue o áudio novo
    
    // 1. Criar novo output stream
    let (_stream, stream_handle) = OutputStream::try_default()
        .map_err(|e| format!("Falha no áudio: {}", e))?;
    
    // 2. Criar novo Sink
    let sink = Sink::try_new(&stream_handle)
        .map_err(|e| format!("Falha no sink: {}", e))?;

    // 3. Tocar a URL (Isso vai requerer reqwest ou similar para baixar o stream, 
    // mas o Rodio não toca URL direta HTTP sem decodificar. 
    // O ideal seria passar a URL para o ffmpeg ou baixar o buffer.
    // **NOTA**: O código abaixo assume que você vai implementar a lógica de decodificação da URL.
    // O Rodio precisa de uma fonte (Source). 
    // Para simplificar, vou deixar o sink criado, mas você precisa alimentar o audio nele.
    
    // Atualiza o estado global
    let mut state_stream = state._stream.lock().map_err(|_| "Falha no lock stream")?;
    let mut state_sink = state.sink.lock().map_err(|_| "Falha no lock sink")?;

    // Guardamos o stream (para não fechar o áudio) e o sink (para pausar/volume)
    *state_stream = Some(RodioStream(_stream));
    *state_sink = Some(sink);

    Ok("Reproduzindo... (Lógica de decode pendente)".to_string())
}

#[tauri::command]
fn toggle_pause(state: State<'_, PlayerState>) -> Result<String, String> {
    let sink_guard = state.sink.lock().map_err(|_| "Falha no lock")?;
    
    if let Some(sink) = sink_guard.as_ref() {
        if sink.is_paused() {
            sink.play();
            Ok("Playing".to_string())
        } else {
            sink.pause();
            Ok("Paused".to_string())
        }
    } else {
        Err("Nada tocando".to_string())
    }
}

#[tauri::command]
fn set_volume(vol: f32, state: State<'_, PlayerState>) -> Result<(), String> {
    let sink_guard = state.sink.lock().map_err(|_| "Falha no lock")?;
    
    if let Some(sink) = sink_guard.as_ref() {
        sink.set_volume(vol);
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        // Inicializa o plugin Shell (Obrigatório no v2)
        .plugin(tauri_plugin_shell::init()) 
        .manage(PlayerState {
            sink: Arc::new(Mutex::new(None)),
            _stream: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![play_track, toggle_pause, set_volume])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}