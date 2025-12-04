const { invoke } = window.__TAURI__.tauri;

const searchInput = document.getElementById("search-input");
const statusTxt = document.getElementById("track-status");
const playIcon = document.getElementById("play-icon");
const volSlider = document.getElementById("vol-slider");

// Buscar ao pressionar Enter
searchInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
        const query = searchInput.value;
        if (!query) return;

        searchInput.disabled = true;
        statusTxt.textContent = "Buscando e processando fluxo...";
        statusTxt.style.color = "#00e5ff";

        try {
            // Chama a função Rust 'play_track'
            await invoke("play_track", { query: query });
            
            statusTxt.textContent = "Reproduzindo Streaming";
            statusTxt.style.color = "#00ff88";
            playIcon.textContent = "pause";
            searchInput.value = "";
            searchInput.disabled = false;
        } catch (error) {
            statusTxt.textContent = "Erro: " + error;
            statusTxt.style.color = "red";
            searchInput.disabled = false;
        }
    }
});

// Botão Play/Pause
window.togglePause = async () => {
    await invoke("toggle_pause");
    // Alterna ícone visualmente
    if (playIcon.textContent === "play_arrow") {
        playIcon.textContent = "pause";
    } else {
        playIcon.textContent = "play_arrow";
    }
};

// Volume
volSlider.addEventListener("input", async (e) => {
    const val = parseFloat(e.target.value);
    await invoke("set_volume", { vol: val });
});