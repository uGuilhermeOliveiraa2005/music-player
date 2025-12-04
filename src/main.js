import { invoke } from '@tauri-apps/api/core';

const searchInput = document.getElementById("search-input");
const statusTxt = document.getElementById("track-status");
const playIcon = document.getElementById("play-icon");
const volSlider = document.getElementById("vol-slider");
const playBtn = document.getElementById("play-btn");

// Variável Global do Player
let audioPlayer = new Audio();

// Configuração inicial
audioPlayer.volume = 0.5;

// Eventos do Player (Para atualizar a UI quando a música acabar ou der erro)
audioPlayer.onplaying = () => {
    statusTxt.textContent = "Reproduzindo Streaming (Web Audio)";
    statusTxt.style.color = "#00ff88";
    playIcon.textContent = "pause";
};

audioPlayer.onerror = () => {
    statusTxt.textContent = "Erro ao carregar stream.";
    statusTxt.style.color = "red";
    playIcon.textContent = "play_arrow";
};

audioPlayer.onended = () => {
    playIcon.textContent = "play_arrow";
    statusTxt.textContent = "Fim da reprodução.";
};

// Função Play/Pause
function togglePause() {
    if (audioPlayer.paused && audioPlayer.src) {
        audioPlayer.play();
        playIcon.textContent = "pause";
    } else if (!audioPlayer.paused) {
        audioPlayer.pause();
        playIcon.textContent = "play_arrow";
    }
}

// Botão de Play na UI
if (playBtn) {
    playBtn.addEventListener("click", togglePause);
}

// Busca ao dar Enter
searchInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
        const query = searchInput.value;
        if (!query) return;

        // Reset visual
        audioPlayer.pause();
        searchInput.disabled = true;
        statusTxt.textContent = "Buscando link...";
        statusTxt.style.color = "#00e5ff";

        try {
            // Pede o link ao Rust
            const url = await invoke("play_track", { query: query });
            
            console.log("Link recebido:", url);
            statusTxt.textContent = "Carregando stream...";
            
            // TOCA NO JAVASCRIPT (Instantâneo)
            audioPlayer.src = url;
            audioPlayer.play(); // O navegador lida com o buffer magicamente

            searchInput.value = "";
            searchInput.disabled = false;
        } catch (error) {
            console.error(error);
            statusTxt.textContent = "Erro: " + error;
            statusTxt.style.color = "red";
            searchInput.disabled = false;
        }
    }
});

// Controle de Volume
volSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    audioPlayer.volume = val;
});