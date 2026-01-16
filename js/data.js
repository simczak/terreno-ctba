// Gerenciamento de Dados - CRUD para Terrenos

const DataManager = {
    terrenos: [],
    nextId: 1,

    // Carregar dados do JSON
    async load() {
        try {
            const response = await fetch('data/terrenos.json');
            const data = await response.json();
            this.terrenos = data.terrenos || [];

            // Encontrar o maior ID para definir o proximo
            if (this.terrenos.length > 0) {
                const maxId = Math.max(...this.terrenos.map(t => t.id));
                this.nextId = maxId + 1;
            }

            return this.terrenos;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.terrenos = [];
            return [];
        }
    },

    // Obter todos os terrenos
    getAll() {
        return this.terrenos;
    },

    // Obter terreno por ID
    getById(id) {
        return this.terrenos.find(t => t.id === id);
    },

    // Adicionar novo terreno
    add(terreno) {
        terreno.id = this.nextId++;

        // Calcular preco por m2
        if (terreno.valor && terreno.area_m2) {
            terreno.preco_m2 = Math.round(terreno.valor / terreno.area_m2);
        }

        // Extrair coordenadas do link do Google Maps se nao fornecidas
        if (terreno.link_maps && (!terreno.coordenadas || !terreno.coordenadas.lat)) {
            const coords = this.extractCoordsFromGoogleMaps(terreno.link_maps);
            if (coords) {
                terreno.coordenadas = coords;
            } else {
                // Usar coordenadas padrao de Curitiba
                terreno.coordenadas = { lat: -25.4284, lng: -49.2733 };
            }
        }

        this.terrenos.push(terreno);
        this.saveToLocalStorage();
        return terreno;
    },

    // Atualizar terreno existente
    update(id, data) {
        const index = this.terrenos.findIndex(t => t.id === id);
        if (index === -1) return null;

        // Calcular preco por m2
        if (data.valor && data.area_m2) {
            data.preco_m2 = Math.round(data.valor / data.area_m2);
        }

        // Extrair coordenadas do link do Google Maps se alterado
        if (data.link_maps && (!data.coordenadas || !data.coordenadas.lat)) {
            const coords = this.extractCoordsFromGoogleMaps(data.link_maps);
            if (coords) {
                data.coordenadas = coords;
            }
        }

        this.terrenos[index] = { ...this.terrenos[index], ...data };
        this.saveToLocalStorage();
        return this.terrenos[index];
    },

    // Excluir terreno
    delete(id) {
        const index = this.terrenos.findIndex(t => t.id === id);
        if (index === -1) return false;

        this.terrenos.splice(index, 1);
        this.saveToLocalStorage();
        return true;
    },

    // Extrair coordenadas do link do Google Maps
    extractCoordsFromGoogleMaps(url) {
        if (!url) return null;

        // Padrao 1: @lat,lng em URLs longas do Google Maps
        const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        let match = url.match(atPattern);
        if (match) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            };
        }

        // Padrao 2: ll=lat,lng
        const llPattern = /ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
        match = url.match(llPattern);
        if (match) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            };
        }

        // Padrao 3: place/lat,lng
        const placePattern = /place\/(-?\d+\.\d+),(-?\d+\.\d+)/;
        match = url.match(placePattern);
        if (match) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            };
        }

        return null;
    },

    // Salvar no localStorage como backup
    saveToLocalStorage() {
        localStorage.setItem('terrenos_backup', JSON.stringify({
            terrenos: this.terrenos,
            lastUpdate: new Date().toISOString()
        }));
    },

    // Carregar do localStorage se disponivel
    loadFromLocalStorage() {
        const backup = localStorage.getItem('terrenos_backup');
        if (backup) {
            try {
                const data = JSON.parse(backup);
                return data.terrenos || [];
            } catch (e) {
                return [];
            }
        }
        return [];
    },

    // Exportar dados como JSON
    exportJSON() {
        const data = {
            terrenos: this.terrenos,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `terrenos_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Obter estatisticas
    getStats() {
        if (this.terrenos.length === 0) {
            return {
                total: 0,
                mediaPrecoM2: 0,
                menorValor: 0,
                maiorValor: 0
            };
        }

        const valores = this.terrenos.map(t => t.valor);
        const precosM2 = this.terrenos.map(t => t.preco_m2);

        return {
            total: this.terrenos.length,
            mediaPrecoM2: Math.round(precosM2.reduce((a, b) => a + b, 0) / precosM2.length),
            menorValor: Math.min(...valores),
            maiorValor: Math.max(...valores)
        };
    },

    // Obter lista de bairros unicos
    getBairros() {
        const bairros = [...new Set(this.terrenos.map(t => t.bairro))];
        return bairros.sort();
    },

    // Filtrar por bairro
    filterByBairro(bairro) {
        if (!bairro) return this.terrenos;
        return this.terrenos.filter(t => t.bairro === bairro);
    },

    // Ordenar terrenos
    sort(campo, direcao = 'asc') {
        return [...this.terrenos].sort((a, b) => {
            let valorA = a[campo];
            let valorB = b[campo];

            // Tratar strings
            if (typeof valorA === 'string') {
                valorA = valorA.toLowerCase();
                valorB = valorB.toLowerCase();
            }

            if (valorA < valorB) return direcao === 'asc' ? -1 : 1;
            if (valorA > valorB) return direcao === 'asc' ? 1 : -1;
            return 0;
        });
    }
};

// Funcao auxiliar para formatar valores em Real
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Funcao auxiliar para formatar numeros
function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value);
}
