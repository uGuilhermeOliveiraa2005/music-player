import { defineConfig } from "vite";
import { resolve } from "path"; // Importante para resolver caminhos

export default defineConfig({
  clearScreen: false,
  
  // AQUI ESTÁ O SEGREDO: Mudamos a raiz para "src"
  root: "src", 

  server: {
    port: 5173,
    strictPort: true,
    host: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  // Como mudamos a raiz, precisamos dizer onde jogar os arquivos finais (build)
  build: {
    outDir: "../dist", // Volta uma pasta e cria a dist na raiz do projeto
    emptyOutDir: true,
  },
});