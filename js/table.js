// Gerenciamento da Tabela

const TableManager = {
    tableBody: null,
    currentSort: { campo: 'valor', direcao: 'asc' },
    allExpanded: true, // Por padrao, todas as observacoes estao expandidas

    // Inicializar tabela
    init() {
        this.tableBody = document.getElementById('terrenosTableBody');

        // Configurar ordenacao nas colunas
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const campo = th.dataset.sort;
                this.sortBy(campo);
            });
        });

        // Configurar botoes de expandir/colapsar
        const btnExpandAll = document.getElementById('btnExpandAll');
        const btnCollapseAll = document.getElementById('btnCollapseAll');

        if (btnExpandAll) {
            btnExpandAll.addEventListener('click', () => this.expandAll());
        }
        if (btnCollapseAll) {
            btnCollapseAll.addEventListener('click', () => this.collapseAll());
        }

        return this;
    },

    // Expandir todas as observacoes
    expandAll() {
        this.allExpanded = true;
        this.tableBody.querySelectorAll('.obs-row').forEach(row => {
            row.classList.remove('collapsed');
        });
        this.tableBody.querySelectorAll('.main-row').forEach(row => {
            row.classList.add('expanded');
        });
        this.tableBody.querySelectorAll('.expand-btn').forEach(btn => {
            btn.textContent = '▼';
            btn.title = 'Colapsar observacoes';
        });
    },

    // Colapsar todas as observacoes
    collapseAll() {
        this.allExpanded = false;
        this.tableBody.querySelectorAll('.obs-row').forEach(row => {
            row.classList.add('collapsed');
        });
        this.tableBody.querySelectorAll('.main-row').forEach(row => {
            row.classList.remove('expanded');
        });
        this.tableBody.querySelectorAll('.expand-btn').forEach(btn => {
            btn.textContent = '▶';
            btn.title = 'Expandir observacoes';
        });
    },

    // Alternar expansao de uma linha especifica
    toggleRow(id) {
        const mainRow = this.tableBody.querySelector(`.main-row[data-id="${id}"]`);
        const obsRow = this.tableBody.querySelector(`.obs-row[data-id="${id}"]`);
        const expandBtn = this.tableBody.querySelector(`.expand-btn[data-id="${id}"]`);

        if (obsRow && expandBtn && mainRow) {
            const isCollapsed = obsRow.classList.toggle('collapsed');
            mainRow.classList.toggle('expanded', !isCollapsed);
            expandBtn.textContent = isCollapsed ? '▶' : '▼';
            expandBtn.title = isCollapsed ? 'Expandir observacoes' : 'Colapsar observacoes';
        }
    },

    // Renderizar tabela com os dados
    render(terrenos) {
        this.tableBody.innerHTML = '';

        terrenos.forEach(terreno => {
            const { mainRow, obsRow } = this.createRow(terreno);
            this.tableBody.appendChild(mainRow);
            this.tableBody.appendChild(obsRow);
        });

        // Sincronizar estado visual das observacoes
        if (this.allExpanded) {
            this.expandAll();
        } else {
            this.collapseAll();
        }
    },

    // Criar linha da tabela (retorna linha principal + linha de observacoes)
    createRow(terreno) {
        // Linha principal
        const mainRow = document.createElement('tr');
        mainRow.dataset.id = terreno.id;
        mainRow.classList.add('main-row');
        if (this.allExpanded) {
            mainRow.classList.add('expanded');
        }

        // Valor
        const valorFormatado = formatCurrency(terreno.valor);

        // Classificacoes
        const local = terreno.classificacao ? terreno.classificacao.local : '-';
        const seguranca = terreno.classificacao ? terreno.classificacao.seguranca : '-';
        const formato = terreno.classificacao ? terreno.classificacao.formato : '-';

        // Tempo de deslocamento - tres colunas
        const tempoEscritorioHtml = this.getTempoHtml(terreno, 'escritorio');
        const tempoPaisMarinaHtml = this.getTempoHtml(terreno, 'paisMarina');
        const tempoMaristaHtml = this.getTempoHtml(terreno, 'marista');

        // Nota
        const notaHtml = this.getNotaHtml(terreno.nota);

        // Icone de expandir (seta para baixo se expandido, para direita se colapsado)
        const expandIcon = this.allExpanded ? '▼' : '▶';
        const expandTitle = this.allExpanded ? 'Colapsar observacoes' : 'Expandir observacoes';

        mainRow.innerHTML = `
            <td class="sigla-cell"><strong>T${terreno.id}</strong></td>
            <td class="nota-cell">${notaHtml}</td>
            <td class="value-currency">${valorFormatado}</td>
            <td>${terreno.bairro}</td>
            <td title="${terreno.endereco}">${this.truncateText(terreno.endereco, 30)}</td>
            <td>${formatNumber(terreno.area_m2)} m2</td>
            <td>${formatCurrency(terreno.preco_m2)}</td>
            <td>${this.getBadgeHtml(local)}</td>
            <td>${this.getBadgeHtml(seguranca)}</td>
            <td>${this.getBadgeHtml(formato)}</td>
            <td class="tempo-cell" data-terreno-id="${terreno.id}" data-destino="escritorio">${tempoEscritorioHtml}</td>
            <td class="tempo-cell" data-terreno-id="${terreno.id}" data-destino="paisMarina">${tempoPaisMarinaHtml}</td>
            <td class="tempo-cell" data-terreno-id="${terreno.id}" data-destino="marista">${tempoMaristaHtml}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-expand expand-btn" data-id="${terreno.id}" title="${expandTitle}">${expandIcon}</button>
                    <button class="btn btn-primary btn-small" onclick="App.showOnMap(${terreno.id})" title="Ver no mapa">Mapa</button>
                    <button class="btn btn-secondary btn-small" onclick="App.editTerreno(${terreno.id})" title="Editar">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="App.confirmDelete(${terreno.id})" title="Excluir">X</button>
                </div>
            </td>
        `;

        // Adicionar evento de duplo clique para editar
        mainRow.addEventListener('dblclick', (e) => {
            // Nao editar se clicar no botao de expandir
            if (!e.target.classList.contains('expand-btn')) {
                App.editTerreno(terreno.id);
            }
        });

        // Adicionar evento ao botao de expandir
        const expandBtn = mainRow.querySelector('.expand-btn');
        expandBtn.addEventListener('click', () => this.toggleRow(terreno.id));

        // Linha de observacoes
        const obsRow = document.createElement('tr');
        obsRow.classList.add('obs-row');
        obsRow.dataset.id = terreno.id;
        if (!this.allExpanded) {
            obsRow.classList.add('collapsed');
        }

        const obsContent = terreno.observacoes || 'Sem observacoes';
        obsRow.innerHTML = `
            <td colspan="14" class="obs-content-cell">
                <div class="obs-content">
                    <strong>Observacoes:</strong> ${obsContent}
                </div>
            </td>
        `;

        return { mainRow, obsRow };
    },

    // Obter HTML da coluna de tempo para um destino especifico
    getTempoHtml(terreno, destinoKey) {
        let tempoField, textoField, defaultField, defaultTextoField;
        if (destinoKey === 'escritorio') {
            tempoField = 'tempo_escritorio';
            textoField = 'tempo_escritorio_texto';
            defaultField = 'tempo_escritorio_default';
            defaultTextoField = 'tempo_escritorio_default_texto';
        } else if (destinoKey === 'paisMarina') {
            tempoField = 'tempo_pais_marina';
            textoField = 'tempo_pais_marina_texto';
            defaultField = 'tempo_pais_marina_default';
            defaultTextoField = 'tempo_pais_marina_default_texto';
        } else if (destinoKey === 'marista') {
            tempoField = 'tempo_marista';
            textoField = 'tempo_marista_texto';
            defaultField = 'tempo_marista_default';
            defaultTextoField = 'tempo_marista_default_texto';
        }

        // Se tem tempo default e tempo atual diferente, mostrar comparacao
        if (terreno[defaultField] && terreno[tempoField] && terreno[tempoField] !== terreno[defaultField]) {
            const minutosDefault = terreno[defaultField];
            const minutosAtual = terreno[tempoField];
            const diferenca = minutosAtual - minutosDefault;

            let badgeClassDefault = 'badge-otimo';
            if (minutosDefault > 20) badgeClassDefault = 'badge-bom';
            if (minutosDefault > 30) badgeClassDefault = 'badge-ruim';

            const diferencaClass = diferenca > 0 ? 'tempo-pior' : 'tempo-melhor';
            const diferencaTexto = diferenca > 0 ? `+${diferenca}` : `${diferenca}`;

            return `<div class="tempo-comparacao" onclick="App.abrirRota(${terreno.id}, '${destinoKey}')" style="cursor: pointer;">
                        <span class="badge ${badgeClassDefault}" title="Tempo default">${terreno[defaultTextoField] || minutosDefault + ' min'}</span>
                        <span class="tempo-diferenca ${diferencaClass}" title="Diferenca atual">${diferencaTexto} min</span>
                    </div>`;
        }

        // Se tem apenas tempo (default ou atual), mostrar normalmente
        if (terreno[tempoField] || terreno[defaultField]) {
            const minutos = terreno[tempoField] || terreno[defaultField];
            const texto = terreno[textoField] || terreno[defaultTextoField] || minutos + ' min';
            let badgeClass = 'badge-otimo';
            if (minutos > 20) badgeClass = 'badge-bom';
            if (minutos > 30) badgeClass = 'badge-ruim';

            return `<span class="badge ${badgeClass}" title="Clique para ver rota"
                    onclick="App.abrirRota(${terreno.id}, '${destinoKey}')" style="cursor: pointer;">
                    ${texto}
                    </span>`;
        }
        return `<button class="btn btn-small" onclick="App.abrirRota(${terreno.id}, '${destinoKey}')" title="Ver rota">-</button>`;
    },

    // Atualizar tempo de um terreno especifico para um destino
    updateTempo(id, tempoData, destinoKey) {
        const cell = this.tableBody.querySelector(`td.tempo-cell[data-terreno-id="${id}"][data-destino="${destinoKey}"]`);
        if (cell) {
            if (tempoData.error) {
                cell.innerHTML = `<span class="badge badge-neutro" title="${tempoData.error}">-</span>`;
            } else {
                const minutos = tempoData.duracao_minutos;
                let badgeClass = 'badge-otimo';
                if (minutos > 20) badgeClass = 'badge-bom';
                if (minutos > 30) badgeClass = 'badge-ruim';

                cell.innerHTML = `<span class="badge ${badgeClass}" title="Clique para ver rota"
                        onclick="App.abrirRota(${id}, '${destinoKey}')" style="cursor: pointer;">
                        ${tempoData.duracao_texto}
                        </span>`;
            }
        }
    },

    // Atualizar tempo com comparacao entre default e atual
    updateTempoComparacao(id, tempoData, destinoKey, terreno, modoComparacao) {
        const cell = this.tableBody.querySelector(`td.tempo-cell[data-terreno-id="${id}"][data-destino="${destinoKey}"]`);
        if (!cell) return;

        if (tempoData.error) {
            console.error(`Erro ao calcular tempo para terreno ${id}, destino ${destinoKey}:`, tempoData.error);
            // Nao substitui o tempo existente - apenas adiciona indicador de erro
            const existingContent = cell.innerHTML.trim();
            if (!existingContent.includes('badge-erro')) {
                // Adiciona indicador de erro ao lado do tempo existente se houver
                if (existingContent && !existingContent.includes('-</button>') && !existingContent.includes('>-<')) {
                    cell.innerHTML += `<span class="badge badge-erro" title="Erro ao atualizar: ${tempoData.error}" style="cursor:help; background-color:#ffcdd2; color:#c62828; font-size:10px; margin-left:4px;">!</span>`;
                } else {
                    cell.innerHTML = `<span class="badge badge-erro" title="Erro: ${tempoData.error}" style="cursor:help; background-color:#ffcdd2; color:#c62828;">Erro</span>`;
                }
            }
            return;
        }

        // Obter campos default
        let defaultField, defaultTextoField;
        if (destinoKey === 'escritorio') {
            defaultField = 'tempo_escritorio_default';
            defaultTextoField = 'tempo_escritorio_default_texto';
        } else if (destinoKey === 'paisMarina') {
            defaultField = 'tempo_pais_marina_default';
            defaultTextoField = 'tempo_pais_marina_default_texto';
        } else if (destinoKey === 'marista') {
            defaultField = 'tempo_marista_default';
            defaultTextoField = 'tempo_marista_default_texto';
        }

        const minutosAtual = tempoData.duracao_minutos;
        const minutosDefault = terreno[defaultField];

        // Se nao esta em modo comparacao ou nao tem default, mostrar apenas o valor atual
        if (!modoComparacao || !minutosDefault) {
            let badgeClass = 'badge-otimo';
            if (minutosAtual > 20) badgeClass = 'badge-bom';
            if (minutosAtual > 30) badgeClass = 'badge-ruim';

            cell.innerHTML = `<span class="badge ${badgeClass}" title="Clique para ver rota"
                    onclick="App.abrirRota(${id}, '${destinoKey}')" style="cursor: pointer;">
                    ${tempoData.duracao_texto}
                    </span>`;
            return;
        }

        // Mostrar comparacao
        const diferenca = minutosAtual - minutosDefault;

        let badgeClassDefault = 'badge-otimo';
        if (minutosDefault > 20) badgeClassDefault = 'badge-bom';
        if (minutosDefault > 30) badgeClassDefault = 'badge-ruim';

        const diferencaClass = diferenca > 0 ? 'tempo-pior' : (diferenca < 0 ? 'tempo-melhor' : 'tempo-igual');
        const diferencaTexto = diferenca > 0 ? `+${diferenca}` : (diferenca < 0 ? `${diferenca}` : '=');

        cell.innerHTML = `<div class="tempo-comparacao" onclick="App.abrirRota(${id}, '${destinoKey}')" style="cursor: pointer;">
                    <span class="badge ${badgeClassDefault}" title="Tempo default">${terreno[defaultTextoField] || minutosDefault + ' min'}</span>
                    <span class="tempo-diferenca ${diferencaClass}" title="Diferenca atual">${diferencaTexto} min</span>
                </div>`;
    },

    // Obter HTML da nota
    getNotaHtml(nota) {
        if (!nota && nota !== 0) {
            return '<span class="nota-badge nota-pendente">-</span>';
        }
        let notaClass = 'nota-ruim';
        if (nota >= 7) notaClass = 'nota-otima';
        else if (nota >= 5) notaClass = 'nota-boa';
        else if (nota >= 3) notaClass = 'nota-media';

        return `<span class="nota-badge ${notaClass}" title="Clique para ver detalhes">${nota.toFixed(1)}</span>`;
    },

    // Obter HTML do badge baseado no valor
    getBadgeHtml(valor) {
        if (!valor || valor === '-') return '<span class="badge badge-neutro">-</span>';

        let badgeClass = 'badge-neutro';
        const valorLower = valor.toLowerCase();

        if (['otimo', 'muito bom', 'boa', 'bom'].some(v => valorLower.includes(v))) {
            badgeClass = 'badge-otimo';
        } else if (['ok', 'mais ou menos'].some(v => valorLower.includes(v))) {
            badgeClass = 'badge-bom';
        } else if (['ruim', 'perigoso', 'alaga', 'longe', 'estreito'].some(v => valorLower.includes(v))) {
            badgeClass = 'badge-ruim';
        }

        return `<span class="badge ${badgeClass}">${valor}</span>`;
    },

    // Truncar texto longo
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    // Ordenar por campo
    sortBy(campo) {
        // Alternar direcao se for o mesmo campo
        if (this.currentSort.campo === campo) {
            this.currentSort.direcao = this.currentSort.direcao === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.campo = campo;
            this.currentSort.direcao = 'asc';
        }

        // Atualizar indicadores visuais
        this.updateSortIndicators();

        // Ordenar e renderizar
        const terrenos = DataManager.sort(campo, this.currentSort.direcao);
        this.render(terrenos);
    },

    // Atualizar indicadores visuais de ordenacao
    updateSortIndicators() {
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
            if (th.dataset.sort === this.currentSort.campo) {
                th.classList.add(`sorted-${this.currentSort.direcao}`);
            }
        });
    },

    // Filtrar por bairro
    filterByBairro(bairro) {
        const terrenos = DataManager.filterByBairro(bairro);
        this.render(terrenos);
    },

    // Atualizar linha especifica
    updateRow(terreno) {
        const existingMainRow = this.tableBody.querySelector(`tr.main-row[data-id="${terreno.id}"]`);
        const existingObsRow = this.tableBody.querySelector(`tr.obs-row[data-id="${terreno.id}"]`);

        if (existingMainRow) {
            const { mainRow, obsRow } = this.createRow(terreno);
            existingMainRow.replaceWith(mainRow);
            if (existingObsRow) {
                existingObsRow.replaceWith(obsRow);
            }
        } else {
            // Adicionar novas linhas
            const { mainRow, obsRow } = this.createRow(terreno);
            this.tableBody.appendChild(mainRow);
            this.tableBody.appendChild(obsRow);
        }
    },

    // Remover linha
    removeRow(id) {
        const mainRow = this.tableBody.querySelector(`tr.main-row[data-id="${id}"]`);
        const obsRow = this.tableBody.querySelector(`tr.obs-row[data-id="${id}"]`);

        if (mainRow) {
            mainRow.remove();
        }
        if (obsRow) {
            obsRow.remove();
        }
    },

    // Destacar linha
    highlightRow(id) {
        // Remover destaque anterior
        this.tableBody.querySelectorAll('tr.main-row').forEach(tr => {
            tr.style.backgroundColor = '';
        });

        // Adicionar destaque na linha principal
        const mainRow = this.tableBody.querySelector(`tr.main-row[data-id="${id}"]`);
        if (mainRow) {
            mainRow.style.backgroundColor = '#e3f2fd';
            mainRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Remover destaque apos 2 segundos
            setTimeout(() => {
                mainRow.style.backgroundColor = '';
            }, 2000);
        }
    }
};
