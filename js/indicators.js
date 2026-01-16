// Gerenciamento dos Indicadores Visuais

const IndicatorsManager = {
    terrenos: [],
    highlightedId: null,

    // Inicializar
    init() {
        return this;
    },

    // Renderizar todos os indicadores
    render(terrenos) {
        this.terrenos = terrenos;

        this.renderValor();
        this.renderRanking();
        this.renderArea();
        this.renderScatter();
        this.renderMatriz();
        this.renderFormato();
        this.renderTempoEscritorio();
        this.renderTempoPais();
        this.renderTempoMarista();
        this.renderBairros();
    },

    // Destacar um terreno em todos os indicadores
    highlight(id) {
        this.highlightedId = id;

        // Remover destaque anterior
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });

        // Adicionar destaque
        if (id) {
            document.querySelectorAll(`[data-terreno-id="${id}"]`).forEach(el => {
                el.classList.add('highlighted');
            });
        }
    },

    // Utilitario: formatar moeda
    formatCurrency(value) {
        if (value >= 1000000) {
            return 'R$ ' + (value / 1000000).toFixed(1) + 'M';
        }
        return 'R$ ' + (value / 1000).toFixed(0) + 'K';
    },

    // Utilitario: formatar numero
    formatNumber(value) {
        return value.toLocaleString('pt-BR');
    },

    // Utilitario: calcular posicao percentual
    calcPosition(value, min, max) {
        if (max === min) return 50;
        return ((value - min) / (max - min)) * 100;
    },

    // ==========================================
    // INDICADOR 1: VALOR (Range Visual)
    // ==========================================
    renderValor() {
        const container = document.getElementById('valorContent');
        if (!container || this.terrenos.length === 0) return;

        const valores = this.terrenos.map(t => t.valor);
        const min = Math.min(...valores);
        const max = Math.max(...valores);
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const mediana = this.calcMediana(valores);

        let html = `
            <div class="range-container">
                <div class="range-track">
        `;

        // Adicionar marcadores para cada terreno
        this.terrenos.forEach(t => {
            const pos = this.calcPosition(t.valor, min, max);
            html += `
                <div class="range-marker"
                     data-terreno-id="${t.id}"
                     style="left: ${pos}%"
                     onclick="IndicatorsManager.onTerrenoClick(${t.id})">
                    <span class="marker-tooltip">
                        <strong>T${t.id} - ${t.bairro}</strong><br>
                        ${this.formatCurrency(t.valor)}
                    </span>
                    T${t.id}
                </div>
            `;
        });

        html += `
                </div>
                <div class="range-labels">
                    <span>${this.formatCurrency(min)}</span>
                    <span>${this.formatCurrency(max)}</span>
                </div>
                <div class="range-stats">
                    <div class="range-stat">
                        <div class="range-stat-value">${this.formatCurrency(media)}</div>
                        <div class="range-stat-label">Media</div>
                    </div>
                    <div class="range-stat">
                        <div class="range-stat-value">${this.formatCurrency(mediana)}</div>
                        <div class="range-stat-label">Mediana</div>
                    </div>
                    <div class="range-stat">
                        <div class="range-stat-value">${this.terrenos.length}</div>
                        <div class="range-stat-label">Terrenos</div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    // ==========================================
    // INDICADOR 2: RANKING POR NOTA
    // ==========================================
    renderRanking() {
        const container = document.getElementById('rankingContent');
        if (!container || this.terrenos.length === 0) return;

        // Ordenar por nota decrescente
        const sorted = [...this.terrenos].sort((a, b) => (b.nota || 0) - (a.nota || 0));

        let html = '<div class="ranking-container">';

        sorted.forEach((t, index) => {
            const nota = t.nota || 0;
            const notaClass = nota >= 7 ? 'nota-otima' : nota >= 5 ? 'nota-boa' : nota >= 3 ? 'nota-media' : 'nota-ruim';
            const topClass = index < 3 ? `top-${index + 1}` : '';
            const posClass = index < 3 ? `pos-${index + 1}` : '';

            html += `
                <div class="ranking-item ${topClass}"
                     data-terreno-id="${t.id}"
                     onclick="IndicatorsManager.onTerrenoClick(${t.id})">
                    <span class="ranking-position ${posClass}">#${index + 1}</span>
                    <div class="ranking-info">
                        <div class="ranking-name">T${t.id}</div>
                        <div class="ranking-bairro">${t.bairro}</div>
                    </div>
                    <div class="ranking-bar">
                        <div class="ranking-fill ${notaClass}" style="width: ${nota * 10}%"></div>
                    </div>
                    <span class="ranking-nota">${nota.toFixed(1)}</span>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    // ==========================================
    // INDICADOR 3: AREA (Barras Horizontais)
    // ==========================================
    renderArea() {
        const container = document.getElementById('areaContent');
        if (!container || this.terrenos.length === 0) return;

        // Ordenar por area decrescente
        const sorted = [...this.terrenos].sort((a, b) => b.area_m2 - a.area_m2);
        const maxArea = sorted[0].area_m2;

        // Definir zona ideal (exemplo: 2000-5000 m2)
        const idealMin = 2000;
        const idealMax = 5000;

        let html = '<div class="bars-container">';

        sorted.forEach(t => {
            const percent = (t.area_m2 / maxArea) * 100;
            let barClass = 'bar-bom';
            if (t.area_m2 >= idealMin && t.area_m2 <= idealMax) {
                barClass = 'bar-otimo';
            } else if (t.area_m2 < idealMin * 0.5 || t.area_m2 > idealMax * 2) {
                barClass = 'bar-ruim';
            }

            html += `
                <div class="bar-item"
                     data-terreno-id="${t.id}"
                     onclick="IndicatorsManager.onTerrenoClick(${t.id})">
                    <span class="bar-label" title="${t.bairro}">T${t.id} - ${t.bairro.substring(0, 12)}</span>
                    <div class="bar-track">
                        <div class="bar-fill ${barClass}" style="width: ${percent}%"></div>
                    </div>
                    <span class="bar-value">${this.formatNumber(t.area_m2)} m2</span>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    // ==========================================
    // INDICADOR 4: SCATTER (Preco/m2 vs Area)
    // ==========================================
    renderScatter() {
        const container = document.getElementById('scatterContent');
        if (!container || this.terrenos.length === 0) return;

        const areas = this.terrenos.map(t => t.area_m2);
        const precos = this.terrenos.map(t => t.preco_m2);

        const minArea = Math.min(...areas);
        const maxArea = Math.max(...areas);
        const minPreco = Math.min(...precos);
        const maxPreco = Math.max(...precos);
        const mediaArea = areas.reduce((a, b) => a + b, 0) / areas.length;
        const mediaPreco = precos.reduce((a, b) => a + b, 0) / precos.length;

        let html = `
            <div class="scatter-container">
                <div class="scatter-quadrants">
                    <div class="scatter-quadrant q-bom">Area pequena<br>Preco baixo<br>(BOM)</div>
                    <div class="scatter-quadrant q-otimo">Area grande<br>Preco baixo<br>(OTIMO!)</div>
                    <div class="scatter-quadrant q-evitar">Area pequena<br>Preco alto<br>(EVITAR)</div>
                    <div class="scatter-quadrant q-avaliar">Area grande<br>Preco alto<br>(AVALIAR)</div>
                </div>
        `;

        // Adicionar pontos (range de 5% a 95% para garantir visibilidade)
        this.terrenos.forEach(t => {
            // X: area pequena (esquerda) -> area grande (direita)
            const x = 5 + this.calcPosition(t.area_m2, minArea, maxArea) * 0.9;
            // Y: preco baixo (topo) -> preco alto (embaixo)
            const y = 5 + this.calcPosition(t.preco_m2, minPreco, maxPreco) * 0.9;

            html += `
                <div class="scatter-point"
                     data-terreno-id="${t.id}"
                     style="left: ${x}%; top: ${y}%"
                     title="T${t.id} - ${t.bairro}: ${this.formatNumber(t.area_m2)}m2, R$${t.preco_m2}/m2"
                     onclick="IndicatorsManager.onTerrenoClick(${t.id})">
                    T${t.id}
                </div>
            `;
        });

        html += `
                <div class="scatter-axis-x">Area (m2) →</div>
                <div class="scatter-axis-y">← Preco/m2</div>
            </div>
        `;

        container.innerHTML = html;
    },

    // ==========================================
    // INDICADOR 5: MATRIZ (Local x Seguranca)
    // ==========================================
    renderMatriz() {
        const container = document.getElementById('matrizContent');
        if (!container || this.terrenos.length === 0) return;

        const localOptions = ['Otimo', 'Muito bom', 'Bom', 'ok', 'Longe', 'Ruim'];
        const segurancaOptions = ['Boa', 'ok', 'mais ou menos', 'Perigoso'];

        // Criar matriz
        const matriz = {};
        localOptions.forEach(l => {
            matriz[l] = {};
            segurancaOptions.forEach(s => {
                matriz[l][s] = [];
            });
        });

        // Preencher matriz
        this.terrenos.forEach(t => {
            const local = t.classificacao?.local || 'ok';
            const seg = t.classificacao?.seguranca || 'ok';
            if (matriz[local] && matriz[local][seg]) {
                matriz[local][seg].push(t);
            }
        });

        let html = `
            <div class="matriz-container">
                <table class="matriz-table">
                    <thead>
                        <tr>
                            <th></th>
                            ${segurancaOptions.map(s => `<th class="header-col">${s}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        localOptions.forEach((local, li) => {
            html += `<tr><th>${local}</th>`;

            segurancaOptions.forEach((seg, si) => {
                const terrenos = matriz[local][seg];
                // Calcular cor da celula baseado na combinacao
                const localScore = localOptions.length - li;
                const segScore = segurancaOptions.length - si;
                const totalScore = localScore + segScore;
                let cellClass = 'cell-ruim';
                if (totalScore >= 8) cellClass = 'cell-otimo';
                else if (totalScore >= 6) cellClass = 'cell-bom';
                else if (totalScore >= 4) cellClass = 'cell-medio';

                html += `
                    <td class="matriz-cell ${cellClass}">
                        <div class="matriz-cell-content">
                            ${terrenos.map(t => `
                                <span class="matriz-terreno"
                                      data-terreno-id="${t.id}"
                                      onclick="IndicatorsManager.onTerrenoClick(${t.id})">
                                    T${t.id}
                                </span>
                            `).join('')}
                        </div>
                    </td>
                `;
            });

            html += '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    },

    // ==========================================
    // INDICADOR 6: FORMATO (Distribuicao)
    // ==========================================
    renderFormato() {
        const container = document.getElementById('formatoContent');
        if (!container || this.terrenos.length === 0) return;

        const formatoOptions = [
            { key: 'Otimo', icon: '████', class: 'fill-otimo' },
            { key: 'Bom', icon: '███░', class: 'fill-bom' },
            { key: 'OK', icon: '██░░', class: 'fill-bom' },
            { key: 'Bem estreito', icon: '█░░░', class: 'fill-ruim' },
            { key: 'Estreito em L', icon: '█_░', class: 'fill-ruim' }
        ];

        // Contar terrenos por formato
        const counts = {};
        formatoOptions.forEach(f => counts[f.key] = []);

        this.terrenos.forEach(t => {
            const formato = t.classificacao?.formato || 'OK';
            if (counts[formato]) {
                counts[formato].push(t);
            } else {
                // Tentar encontrar match parcial
                const match = formatoOptions.find(f => formato.toLowerCase().includes(f.key.toLowerCase()));
                if (match) {
                    counts[match.key].push(t);
                }
            }
        });

        const maxCount = Math.max(...Object.values(counts).map(arr => arr.length), 1);

        let html = '<div class="distribuicao-container">';

        formatoOptions.forEach(f => {
            const terrenos = counts[f.key] || [];
            const percent = (terrenos.length / maxCount) * 100;

            html += `
                <div class="distribuicao-item">
                    <div class="distribuicao-icon">${f.icon}</div>
                    <div class="distribuicao-info">
                        <div class="distribuicao-label">${f.key}</div>
                        <div class="distribuicao-bar">
                            <div class="distribuicao-fill ${f.class}" style="width: ${percent}%"></div>
                        </div>
                    </div>
                    <span class="distribuicao-count">${terrenos.length}</span>
                    <span class="distribuicao-terrenos">
                        ${terrenos.map(t => `<span data-terreno-id="${t.id}" onclick="IndicatorsManager.onTerrenoClick(${t.id})" style="cursor:pointer">T${t.id}</span>`).join(', ')}
                    </span>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    // ==========================================
    // INDICADOR 7-9: TEMPOS (Range Visual)
    // ==========================================
    renderTempoRange(containerId, field, textField) {
        const container = document.getElementById(containerId);
        if (!container || this.terrenos.length === 0) return;

        const tempos = this.terrenos.map(t => t[field] || t[field.replace('tempo_', 'tempo_') + '_default'] || 60).filter(v => v > 0);
        if (tempos.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#7f8c8d;">Sem dados</p>';
            return;
        }

        const min = Math.min(...tempos);
        const max = Math.max(...tempos);
        const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;

        let html = `
            <div class="range-container">
                <div class="range-track" style="background: linear-gradient(to right, #27ae60 0%, #27ae60 33%, #f1c40f 33%, #f1c40f 66%, #e74c3c 66%, #e74c3c 100%);">
        `;

        this.terrenos.forEach(t => {
            const tempo = t[field] || t[field.replace('tempo_', 'tempo_') + '_default'];
            if (!tempo) return;

            const pos = this.calcPosition(tempo, min, max);
            const texto = t[textField] || t[textField.replace('texto', 'default_texto')] || tempo + ' min';

            html += `
                <div class="range-marker"
                     data-terreno-id="${t.id}"
                     style="left: ${pos}%"
                     onclick="IndicatorsManager.onTerrenoClick(${t.id})">
                    <span class="marker-tooltip">
                        <strong>T${t.id} - ${t.bairro}</strong><br>
                        ${texto}
                    </span>
                    T${t.id}
                </div>
            `;
        });

        html += `
                </div>
                <div class="range-labels">
                    <span>${min} min</span>
                    <span>${max} min</span>
                </div>
                <div class="range-stats">
                    <div class="range-stat">
                        <div class="range-stat-value">${media.toFixed(0)} min</div>
                        <div class="range-stat-label">Media</div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    renderTempoEscritorio() {
        this.renderTempoRange('tempoEscritorioContent', 'tempo_escritorio', 'tempo_escritorio_texto');
    },

    renderTempoPais() {
        this.renderTempoRange('tempoPaisContent', 'tempo_pais_marina', 'tempo_pais_marina_texto');
    },

    renderTempoMarista() {
        this.renderTempoRange('tempoMaristaContent', 'tempo_marista', 'tempo_marista_texto');
    },

    // ==========================================
    // INDICADOR 10: BAIRROS (Cards)
    // ==========================================
    renderBairros() {
        const container = document.getElementById('bairrosContent');
        if (!container || this.terrenos.length === 0) return;

        // Agrupar por bairro
        const bairros = {};
        this.terrenos.forEach(t => {
            if (!bairros[t.bairro]) {
                bairros[t.bairro] = [];
            }
            bairros[t.bairro].push(t);
        });

        // Ordenar por quantidade de terrenos
        const sorted = Object.entries(bairros).sort((a, b) => b[1].length - a[1].length);

        let html = '<div class="bairros-grid">';

        sorted.forEach(([bairro, terrenos]) => {
            const mediaValor = terrenos.reduce((a, t) => a + t.valor, 0) / terrenos.length;
            const mediaPrecoM2 = terrenos.reduce((a, t) => a + t.preco_m2, 0) / terrenos.length;
            const mediaNota = terrenos.reduce((a, t) => a + (t.nota || 0), 0) / terrenos.length;
            const siglas = terrenos.map(t => `T${t.id}`).join(', ');

            html += `
                <div class="bairro-card" onclick="IndicatorsManager.onBairroClick('${bairro}')">
                    <div class="bairro-nome">${bairro}</div>
                    <div class="bairro-terrenos-list">${siglas}</div>
                    <div class="bairro-stats">
                        <div class="bairro-stat">
                            <div class="bairro-stat-value">${terrenos.length}</div>
                            <div class="bairro-stat-label">Terrenos</div>
                        </div>
                        <div class="bairro-stat">
                            <div class="bairro-stat-value">${mediaNota.toFixed(1)}</div>
                            <div class="bairro-stat-label">Nota Media</div>
                        </div>
                        <div class="bairro-stat">
                            <div class="bairro-stat-value">${this.formatCurrency(mediaValor)}</div>
                            <div class="bairro-stat-label">Valor Medio</div>
                        </div>
                        <div class="bairro-stat">
                            <div class="bairro-stat-value">R$${mediaPrecoM2.toFixed(0)}</div>
                            <div class="bairro-stat-label">Preco/m2</div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    // ==========================================
    // EVENTOS
    // ==========================================
    onTerrenoClick(id) {
        this.highlight(id);

        // Destacar na tabela e mapa (se existirem)
        if (typeof TableManager !== 'undefined') {
            TableManager.highlightRow(id);
        }
        if (typeof MapManager !== 'undefined') {
            MapManager.focusTerreno(id);
        }
    },

    onBairroClick(bairro) {
        // Filtrar tabela por bairro
        const filterSelect = document.getElementById('filterBairro');
        if (filterSelect) {
            filterSelect.value = bairro;
            if (typeof TableManager !== 'undefined') {
                TableManager.filterByBairro(bairro);
            }
        }
    },

    // ==========================================
    // UTILITARIOS
    // ==========================================
    calcMediana(values) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
};
