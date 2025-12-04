import { defineConfig } from "vite";

export default defineConfig({
  // Impede que o Vite limpe o terminal (bom para ver erros)
  clearScreen: false,
  server: {
    port: 5173,       // Garante a porta 5173
    strictPort: true, // Se a porta estiver ocupada, avisa
    host: true,       // Permite que o Tauri acesse o servidor no Windows
    watch: {
      // Ignora a pasta do Rust para não ficar recarregando à toa
      ignored: ["**/src-tauri/**"],
    },
  },
});