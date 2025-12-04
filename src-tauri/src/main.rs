#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_shell::ShellExt;
use serde::Serialize;
use serde_json::Value;

// Cria uma estrutura para enviar os dados organizados para o JS
#[derive(Serialize)]
struct TrackMetadata {
    url: String,
    title: String,
    author: String,
    thumbnail: String,
}

#[tauri::command]
async fn play_track(query: String, app: tauri::AppHandle) -> Result<TrackMetadata, String> {
    println!("Buscando metadados: {}", query);

    // Executa ytdlp pedindo JSON (-j) em vez de apenas o link (-g)
    let output = app.shell()
        .command("ytdlp")
        .args(&[
            "--no-playlist",
            "-f", "bestaudio",
            "-j", // <--- O segredo: pede o JSON completo
            &query
        ])
        .output()
        .await
        .map_err(|e| format!("Falha ao executar ytdlp: {}", e))?;

    if !output.status.success() {
        return Err("Erro ao buscar música. Verifique o link.".to_string());
    }

    // Pega a saída e tenta converter para JSON
    let stdout = String::from_utf8_lossy(&output.stdout);
    
    // O ytdlp pode retornar várias linhas, pegamos a primeira válida
    let json_str = stdout.lines()
        .find(|line| line.starts_with("{"))
        .ok_or("Nenhum JSON retornado")?;

    let json: Value = serde_json::from_str(json_str)
        .map_err(|e| format!("Erro ao processar JSON: {}", e))?;

    // Extrai os campos que queremos
    // O unwrap_or garante que o app não crashe se faltar algum dado
    let metadata = TrackMetadata {
        url: json["url"].as_str().unwrap_or("").to_string(),
        title: json["title"].as_str().unwrap_or("Desconhecido").to_string(),
        author: json["uploader"].as_str().unwrap_or("Artista Desconhecido").to_string(),
        thumbnail: json["thumbnail"].as_str().unwrap_or("").to_string(),
    };

    println!("Sucesso! Tocando: {}", metadata.title);
    
    Ok(metadata)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![play_track])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}