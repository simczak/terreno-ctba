// Aplicacao Principal - Dashboard de Terrenos

const App = {
    deleteId: null,

    // Inicializar aplicacao
    async init() {
        // Carregar dados
        await DataManager.load();

        // Inicializar mapa
        MapManager.init();

        // Inicializar tabela
        TableManager.init();

        // Inicializar indicadores
        IndicatorsManager.init();

        // Renderizar dados
        this.refresh();

        // Configurar eventos
        this.setupEventListeners();

        // Preencher filtro de bairros
        this.populateBairroFilter();

        console.log('Dashboard inicializado com sucesso!');
    },

    // Atualizar todos os componentes
    refresh() {
        const terrenos = DataManager.getAll();

        // Atualizar estatisticas
        this.updateStats();

        // Atualizar tabela
        TableManager.render(terrenos);

        // Atualizar mapa
        MapManager.addMarkers(terrenos);

        // Atualizar indicadores visuais
        IndicatorsManager.render(terrenos);
    },

    // Atualizar cards de estatisticas
    updateStats() {
        const stats = DataManager.getStats();

        document.getElementById('totalTerrenos').textContent = stats.total;
        document.getElementById('mediaPrecoM2').textContent = formatCurrency(stats.mediaPrecoM2);
        document.getElementById('menorValor').textContent = formatCurrency(stats.menorValor);
        document.getElementById('maiorValor').textContent = formatCurrency(stats.maiorValor);
    },

    // Preencher select de bairros
    populateBairroFilter() {
        const select = document.getElementById('filterBairro');
        const bairros = DataManager.getBairros();

        // Limpar opcoes existentes (exceto a primeira)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Adicionar bairros
        bairros.forEach(bairro => {
            const option = document.createElement('option');
            option.value = bairro;
            option.textContent = bairro;
            select.appendChild(option);
        });
    },

    // Configurar event listeners
    setupEventListeners() {
        // Botao adicionar terreno
        document.getElementById('btnAddTerreno').addEventListener('click', () => {
            this.openModal();
        });

        // Botao exportar JSON
        document.getElementById('btnExportJSON').addEventListener('click', () => {
            DataManager.exportJSON();
        });

        // Filtro de bairro
        document.getElementById('filterBairro').addEventListener('change', (e) => {
            TableManager.filterByBairro(e.target.value);
        });

        // Modal - fechar
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Modal - submit form
        document.getElementById('terrenoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTerreno();
        });

        // Modal de exclusao
        document.getElementById('closeDeleteModal').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteTerreno();
        });

        // Fechar modais ao clicar fora
        document.getElementById('terrenoModal').addEventListener('click', (e) => {
            if (e.target.id === 'terrenoModal') {
                this.closeModal();
            }
        });

        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.closeDeleteModal();
            }
        });

        // Botao "Pegar dados" - extrai coordenadas e calcula tempos
        document.getElementById('btnPegarDados').addEventListener('click', () => {
            this.pegarDadosLocalizacao();
        });

        // Botao calcular tempos
        document.getElementById('btnCalcTempos').addEventListener('click', () => {
            this.calcularTodosTempos();
        });

        // Botao calcular notas
        document.getElementById('btnCalcNotas').addEventListener('click', () => {
            this.calcularTodasNotas();
        });
    },

    // Calcular notas de todos os terrenos
    calcularTodasNotas() {
        const quantidade = ScoringManager.calcularTodos();
        this.refresh();
        alert(`Notas calculadas para ${quantidade} terrenos!`);
    },

    // Pegar dados de localizacao (coords e tempos)
    async pegarDadosLocalizacao() {
        const linkMaps = document.getElementById('link_maps').value;
        const btn = document.getElementById('btnPegarDados');
        const dadosSection = document.getElementById('dadosLocalizacao');

        if (!linkMaps) {
            alert('Por favor, insira um link do Google Maps.');
            return;
        }

        // Extrair coordenadas
        const coords = DataManager.extractCoordsFromGoogleMaps(linkMaps);
        if (!coords) {
            alert('Nao foi possivel extrair coordenadas do link. Verifique se o link esta correto.');
            return;
        }

        // Salvar nos campos ocultos
        document.getElementById('lat').value = coords.lat;
        document.getElementById('lng').value = coords.lng;

        // Mostrar secao de dados
        dadosSection.style.display = 'block';
        document.getElementById('coordsDisplay').textContent = `Coordenadas: ${coords.lat}, ${coords.lng}`;

        // Mostrar loading nos tempos
        const tempoEscritorio = document.getElementById('tempoEscritorioDisplay');
        const tempoPaisMarina = document.getElementById('tempoPaisMarinaDisplay');
        const tempoMarista = document.getElementById('tempoMaristaDisplay');

        tempoEscritorio.textContent = 'Calculando...';
        tempoEscritorio.className = 'tempo-value loading';
        tempoPaisMarina.textContent = 'Calculando...';
        tempoPaisMarina.className = 'tempo-value loading';
        tempoMarista.textContent = 'Calculando...';
        tempoMarista.className = 'tempo-value loading';

        btn.textContent = 'Calculando...';
        btn.disabled = true;

        // Calcular tempos para os 3 destinos
        const destinos = [
            { key: 'escritorio', element: tempoEscritorio },
            { key: 'paisMarina', element: tempoPaisMarina },
            { key: 'marista', element: tempoMarista }
        ];

        for (const destino of destinos) {
            const resultado = await RoutingManager.calcularTempo(coords, destino.key);

            if (resultado.error) {
                destino.element.textContent = 'Erro';
                destino.element.className = 'tempo-value badge-ruim';
            } else {
                destino.element.textContent = resultado.duracao_texto;
                const minutos = resultado.duracao_minutos;
                let badgeClass = 'badge-otimo';
                if (minutos > 20) badgeClass = 'badge-bom';
                if (minutos > 30) badgeClass = 'badge-ruim';
                destino.element.className = `tempo-value ${badgeClass}`;

                // Salvar em campos temporarios para usar no save
                destino.element.dataset.minutos = minutos;
                destino.element.dataset.texto = resultado.duracao_texto;
            }

            await RoutingManager.sleep(300);
        }

        btn.textContent = 'Pegar dados';
        btn.disabled = false;
    },

    // Limpar dados de localizacao no modal
    limparDadosLocalizacao() {
        document.getElementById('dadosLocalizacao').style.display = 'none';
        document.getElementById('coordsDisplay').textContent = 'Coordenadas: --';
        document.getElementById('tempoEscritorioDisplay').textContent = '--';
        document.getElementById('tempoEscritorioDisplay').className = 'tempo-value';
        document.getElementById('tempoPaisMarinaDisplay').textContent = '--';
        document.getElementById('tempoPaisMarinaDisplay').className = 'tempo-value';
        document.getElementById('tempoMaristaDisplay').textContent = '--';
        document.getElementById('tempoMaristaDisplay').className = 'tempo-value';
    },

    // Abrir modal para adicionar/editar
    openModal(terreno = null) {
        const modal = document.getElementById('terrenoModal');
        const form = document.getElementById('terrenoForm');
        const title = document.getElementById('modalTitle');

        // Resetar formulario
        form.reset();
        this.limparDadosLocalizacao();

        if (terreno) {
            // Modo edicao
            title.textContent = 'Editar Terreno';
            document.getElementById('terrenoId').value = terreno.id;
            document.getElementById('valor').value = terreno.valor;
            document.getElementById('area_m2').value = terreno.area_m2;
            document.getElementById('bairro').value = terreno.bairro;
            document.getElementById('endereco').value = terreno.endereco;
            document.getElementById('link_maps').value = terreno.link_maps || '';
            document.getElementById('link_anuncio').value = terreno.link_anuncio || '';

            if (terreno.coordenadas && terreno.coordenadas.lat && terreno.coordenadas.lng) {
                document.getElementById('lat').value = terreno.coordenadas.lat;
                document.getElementById('lng').value = terreno.coordenadas.lng;

                // Mostrar dados de localizacao existentes
                const dadosSection = document.getElementById('dadosLocalizacao');
                dadosSection.style.display = 'block';
                document.getElementById('coordsDisplay').textContent =
                    `Coordenadas: ${terreno.coordenadas.lat}, ${terreno.coordenadas.lng}`;

                // Mostrar tempos existentes
                this.exibirTempoModal('tempoEscritorioDisplay', terreno.tempo_escritorio, terreno.tempo_escritorio_texto);
                this.exibirTempoModal('tempoPaisMarinaDisplay', terreno.tempo_pais_marina, terreno.tempo_pais_marina_texto);
                this.exibirTempoModal('tempoMaristaDisplay', terreno.tempo_marista, terreno.tempo_marista_texto);
            }

            if (terreno.classificacao) {
                document.getElementById('valor_meta').value = terreno.classificacao.valor_meta || 'Bom';
                document.getElementById('local').value = terreno.classificacao.local || 'Bom';
                document.getElementById('seguranca').value = terreno.classificacao.seguranca || 'ok';
                document.getElementById('tamanho').value = terreno.classificacao.tamanho || 'Bom';
                document.getElementById('formato').value = terreno.classificacao.formato || 'Bom';
            }

            document.getElementById('observacoes').value = terreno.observacoes || '';
        } else {
            // Modo adicao
            title.textContent = 'Adicionar Terreno';
            document.getElementById('terrenoId').value = '';
        }

        modal.classList.add('active');
    },

    // Exibir tempo no modal com formatacao
    exibirTempoModal(elementId, minutos, texto) {
        const element = document.getElementById(elementId);
        if (minutos && texto) {
            element.textContent = texto;
            let badgeClass = 'badge-otimo';
            if (minutos > 20) badgeClass = 'badge-bom';
            if (minutos > 30) badgeClass = 'badge-ruim';
            element.className = `tempo-value ${badgeClass}`;
            element.dataset.minutos = minutos;
            element.dataset.texto = texto;
        } else {
            element.textContent = '--';
            element.className = 'tempo-value';
        }
    },

    // Fechar modal
    closeModal() {
        document.getElementById('terrenoModal').classList.remove('active');
    },

    // Salvar terreno (adicionar ou editar)
    saveTerreno() {
        const id = document.getElementById('terrenoId').value;

        // Pegar dados de tempo do modal (se existirem)
        const tempoEscritorioEl = document.getElementById('tempoEscritorioDisplay');
        const tempoPaisMarinaEl = document.getElementById('tempoPaisMarinaDisplay');
        const tempoMaristaEl = document.getElementById('tempoMaristaDisplay');

        const terrenoData = {
            valor: parseInt(document.getElementById('valor').value),
            area_m2: parseInt(document.getElementById('area_m2').value),
            bairro: document.getElementById('bairro').value,
            endereco: document.getElementById('endereco').value,
            link_maps: document.getElementById('link_maps').value,
            link_anuncio: document.getElementById('link_anuncio').value,
            coordenadas: {
                lat: parseFloat(document.getElementById('lat').value) || null,
                lng: parseFloat(document.getElementById('lng').value) || null
            },
            classificacao: {
                valor_meta: document.getElementById('valor_meta').value,
                local: document.getElementById('local').value,
                seguranca: document.getElementById('seguranca').value,
                tamanho: document.getElementById('tamanho').value,
                formato: document.getElementById('formato').value
            },
            observacoes: document.getElementById('observacoes').value
        };

        // Adicionar dados de tempo se existirem
        if (tempoEscritorioEl.dataset.minutos) {
            terrenoData.tempo_escritorio = parseInt(tempoEscritorioEl.dataset.minutos);
            terrenoData.tempo_escritorio_texto = tempoEscritorioEl.dataset.texto;
        }
        if (tempoPaisMarinaEl.dataset.minutos) {
            terrenoData.tempo_pais_marina = parseInt(tempoPaisMarinaEl.dataset.minutos);
            terrenoData.tempo_pais_marina_texto = tempoPaisMarinaEl.dataset.texto;
        }
        if (tempoMaristaEl.dataset.minutos) {
            terrenoData.tempo_marista = parseInt(tempoMaristaEl.dataset.minutos);
            terrenoData.tempo_marista_texto = tempoMaristaEl.dataset.texto;
        }

        let terreno;
        if (id) {
            // Atualizar existente
            terreno = DataManager.update(parseInt(id), terrenoData);
        } else {
            // Adicionar novo
            terreno = DataManager.add(terrenoData);
        }

        // Fechar modal
        this.closeModal();

        // Atualizar interface
        this.updateStats();
        TableManager.updateRow(terreno);
        MapManager.updateMarker(terreno);
        this.populateBairroFilter();

        // Destacar linha na tabela
        TableManager.highlightRow(terreno.id);
    },

    // Editar terreno
    editTerreno(id) {
        const terreno = DataManager.getById(id);
        if (terreno) {
            this.openModal(terreno);
        }
    },

    // Confirmar exclusao
    confirmDelete(id) {
        this.deleteId = id;
        document.getElementById('deleteModal').classList.add('active');
    },

    // Fechar modal de exclusao
    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.deleteId = null;
    },

    // Excluir terreno
    deleteTerreno() {
        if (this.deleteId) {
            DataManager.delete(this.deleteId);

            // Atualizar interface
            this.updateStats();
            TableManager.removeRow(this.deleteId);
            MapManager.removeMarker(this.deleteId);
            this.populateBairroFilter();

            this.closeDeleteModal();
        }
    },

    // Mostrar terreno no mapa
    showOnMap(id) {
        MapManager.focusOnTerreno(id);

        // Scroll para o mapa
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
    },

    // ========== FUNCOES DE CALCULO DE TEMPOS ==========

    // Calcular tempos de todos os terrenos para todos destinos
    async calcularTodosTempos() {
        const terrenos = DataManager.getAll();
        const btn = document.getElementById('btnCalcTempos');
        const originalText = btn.textContent;
        const destinos = ['escritorio', 'paisMarina', 'marista'];

        btn.textContent = 'Calculando...';
        btn.disabled = true;

        // Verificar se ja existem tempos default salvos
        const temAlguemComDefault = terrenos.some(t => t.tempo_escritorio_default);
        const modoComparacao = temAlguemComDefault;

        for (let i = 0; i < terrenos.length; i++) {
            const terreno = terrenos[i];

            if (terreno.coordenadas && terreno.coordenadas.lat && terreno.coordenadas.lng) {
                // Calcular para cada destino
                for (const destinoKey of destinos) {
                    btn.textContent = `Terreno ${i + 1}/${terrenos.length} - ${destinoKey}`;

                    const resultado = await RoutingManager.calcularTempo(terreno.coordenadas, destinoKey);

                    if (!resultado.error) {
                        // Campos especificos para cada destino
                        const updateData = {};

                        if (destinoKey === 'escritorio') {
                            updateData.tempo_escritorio = resultado.duracao_minutos;
                            updateData.tempo_escritorio_texto = resultado.duracao_texto;
                            // Salvar como default se nao existir
                            if (!terreno.tempo_escritorio_default) {
                                updateData.tempo_escritorio_default = resultado.duracao_minutos;
                                updateData.tempo_escritorio_default_texto = resultado.duracao_texto;
                            }
                        } else if (destinoKey === 'paisMarina') {
                            updateData.tempo_pais_marina = resultado.duracao_minutos;
                            updateData.tempo_pais_marina_texto = resultado.duracao_texto;
                            // Salvar como default se nao existir
                            if (!terreno.tempo_pais_marina_default) {
                                updateData.tempo_pais_marina_default = resultado.duracao_minutos;
                                updateData.tempo_pais_marina_default_texto = resultado.duracao_texto;
                            }
                        } else if (destinoKey === 'marista') {
                            updateData.tempo_marista = resultado.duracao_minutos;
                            updateData.tempo_marista_texto = resultado.duracao_texto;
                            // Salvar como default se nao existir
                            if (!terreno.tempo_marista_default) {
                                updateData.tempo_marista_default = resultado.duracao_minutos;
                                updateData.tempo_marista_default_texto = resultado.duracao_texto;
                            }
                        }

                        DataManager.update(terreno.id, updateData);
                    }

                    // Atualizar celula na tabela com comparacao
                    const terrenoAtualizado = DataManager.getById(terreno.id);
                    TableManager.updateTempoComparacao(terreno.id, resultado, destinoKey, terrenoAtualizado, modoComparacao);

                    // Pequena pausa entre requisicoes
                    await RoutingManager.sleep(300);
                }
            }
        }

        btn.textContent = originalText;
        btn.disabled = false;

        // Atualizar tabela completa para mostrar comparacoes
        this.refresh();

        if (modoComparacao) {
            alert('Calculo de tempos concluido!\nComparando tempos atuais com os tempos default salvos.');
        } else {
            alert('Calculo de tempos concluido!\nTempos salvos como default. Execute novamente para comparar.');
        }
    },

    // Abrir rota no Google Maps
    abrirRota(id, destinoKey = 'escritorio') {
        const terreno = DataManager.getById(id);
        if (terreno && terreno.coordenadas) {
            RoutingManager.abrirGoogleMapsDirections(terreno.coordenadas, destinoKey);
        } else {
            alert('Terreno sem coordenadas definidas.');
        }
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
