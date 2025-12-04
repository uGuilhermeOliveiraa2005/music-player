#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_shell::ShellExt;

// Não precisamos mais de estado de player no Rust
// O player viverá no JavaScript (Navegador)

#[tauri::command]
async fn play_track(query: String, app: tauri::AppHandle) -> Result<String, String> {
    println!("Buscando no Rust: {}", query);

    // 1. Executa ytdlp para pegar o link
    let output = app.shell()
        .command("ytdlp")
        .args(&[
            "--no-playlist", // Garante velocidade
            "-f", "bestaudio", 
            "-g", 
            &query
        ])
        .output()
        .await
        .map_err(|e| format!("Falha ao executar ytdlp: {}", e))?;

    if !output.status.success() {
        return Err("Erro ao buscar link. Verifique o ytdlp.".to_string());
    }

    // 2. Extrai a URL
    let stdout = String::from_utf8_lossy(&output.stdout);
    let audio_url = stdout.lines()
        .find(|line| line.starts_with("http"))
        .ok_or("Nenhuma URL encontrada")?
        .trim()
        .to_string();

    println!("URL encontrada! Enviando para o Frontend...");
    
    // Retorna a URL para o JavaScript tocar
    Ok(audio_url)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![play_track])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}