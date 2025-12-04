function switchTab(tabName) {
    // 1. Remove classe 'active' de todos os botões e views
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));

    // 2. Adiciona 'active' no botão clicado
    // (Lógica simples baseada na ordem, idealmente usar IDs nos botões)
    const btnIndex = { 'home': 0, 'search': 1, 'library': 2 }[tabName];
    document.querySelectorAll('.nav-btn')[btnIndex].classList.add('active');

    // 3. Mostra a view correta
    const viewId = `view-${tabName}`;
    const view = document.getElementById(viewId);
    if(view) view.classList.add('active');
}