import { invoke } from '@tauri-apps/api/core';

const searchInput = document.getElementById("search-input");
const statusTxt = document.getElementById("track-status");
const trackTitle = document.getElementById("track-title"); // Pegamos o título
const playIcon = document.getElementById("play-icon");
const volSlider = document.getElementById("vol-slider");
const playBtn = document.getElementById("play-btn");
const albumArtStack = document.querySelector(".album-art-stack"); // Pegamos a área da capa

// Variável Global do Player
let audioPlayer = new Audio();
audioPlayer.volume = 0.5;

// --- Eventos do Player ---
audioPlayer.onplaying = () => {
    // Quando começa a tocar, atualiza ícone
    playIcon.textContent = "pause";
};

audioPlayer.onerror = () => {
    statusTxt.textContent = "Erro ao carregar áudio.";
    statusTxt.style.color = "red";
    playIcon.textContent = "play_arrow";
};

audioPlayer.onended = () => {
    playIcon.textContent = "play_arrow";
    statusTxt.textContent = "Fim da reprodução.";
};

// --- Função Play/Pause ---
function togglePause() {
    if (audioPlayer.paused && audioPlayer.src) {
        audioPlayer.play();
        playIcon.textContent = "pause";
    } else if (!audioPlayer.paused) {
        audioPlayer.pause();
        playIcon.textContent = "play_arrow";
    }
}

if (playBtn) {
    playBtn.addEventListener("click", togglePause);
}

// --- Busca e Metadados ---
searchInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
        const query = searchInput.value;
        if (!query) return;

        // 1. Reset visual antes de buscar
        audioPlayer.pause();
        searchInput.disabled = true;
        
        statusTxt.textContent = "Carregando metadados...";
        statusTxt.style.color = "#00e5ff";
        
        // Reset da capa (volta pro ícone padrão enquanto carrega)
        albumArtStack.innerHTML = `
            <div class="icon-bg">
                <span class="material-icons-round">album</span>
            </div>`;

        try {
            // 2. Chama o Rust e espera o OBJETO metadata
            const metadata = await invoke("play_track", { query: query });
            
            console.log("Metadados recebidos:", metadata);
            
            // 3. Atualiza a Interface
            statusTxt.textContent = metadata.author; // Nome do Artista
            statusTxt.style.color = "#ccc"; // Cor normal
            trackTitle.textContent = metadata.title; // Nome da Música

            // Atualiza a Capa do Álbum
            if (metadata.thumbnail) {
                albumArtStack.innerHTML = `<img src="${metadata.thumbnail}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">`;
            }

            // 4. Toca a música
            audioPlayer.src = metadata.url;
            audioPlayer.play();

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
    audioPlayer.volume = parseFloat(e.target.value);
});