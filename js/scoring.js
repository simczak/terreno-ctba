// Sistema de Pontuacao dos Terrenos

const ScoringManager = {
    // Configuracao dos pesos para cada criterio (total = 100)
    pesos: {
        valor: 20,           // Valor total do terreno
        area: 10,            // Area em m2
        preco_m2: 20,        // Preco por m2
        local: 15,           // Classificacao do local
        seguranca: 10,       // Classificacao de seguranca
        formato: 10,         // Classificacao do formato
        tempo_escritorio: 5, // Tempo ate o escritorio
        tempo_pais_marina: 5,// Tempo ate pais da Marina
        tempo_marista: 5     // Tempo ate Marista
    },

    // Faixas de referencia para calcular notas
    referencias: {
        valor: { min: 990000, max: 4400000 },      // Menor = melhor
        area: { min: 1500, ideal: 3000, max: 10000 }, // Ideal = melhor
        preco_m2: { min: 61, max: 1400 },          // Menor = melhor
        tempo: { otimo: 15, bom: 25, ruim: 40 }    // Menor = melhor (em minutos)
    },

    // Mapeamento de classificacoes para notas (0-10)
    notasClassificacao: {
        local: {
            'otimo': 10,
            'muito bom': 9,
            'bom': 7,
            'ok': 5,
            'longe': 3,
            'ruim': 2,
            'alaga': 0
        },
        seguranca: {
            'boa': 10,
            'ok': 7,
            'mais ou menos': 5,
            'perigoso': 2,
            'alaga': 0
        },
        formato: {
            'otimo': 10,
            'bom': 8,
            'ok': 6,
            'bem estreito': 3,
            'estreito em l': 4
        }
    },

    // Calcular nota para valor (menor = melhor)
    calcularNotaValor(valor) {
        const { min, max } = this.referencias.valor;
        if (valor <= min) return 10;
        if (valor >= max) return 0;
        // Escala inversa linear
        return Math.round(10 * (1 - (valor - min) / (max - min)));
    },

    // Calcular nota para area (ideal ~3000m2 = melhor)
    calcularNotaArea(area) {
        const { min, ideal, max } = this.referencias.area;
        if (area < min) return 3; // Muito pequeno
        if (area > max) return 5; // Muito grande (ainda aproveitavel)
        if (area >= ideal - 500 && area <= ideal + 1000) return 10; // Ideal
        if (area < ideal) {
            // Entre min e ideal
            return Math.round(3 + 7 * ((area - min) / (ideal - min)));
        } else {
            // Entre ideal e max
            return Math.round(10 - 5 * ((area - ideal) / (max - ideal)));
        }
    },

    // Calcular nota para preco/m2 (menor = melhor)
    calcularNotaPrecoM2(preco_m2) {
        const { min, max } = this.referencias.preco_m2;
        if (preco_m2 <= min) return 10;
        if (preco_m2 >= max) return 0;
        // Escala inversa linear
        return Math.round(10 * (1 - (preco_m2 - min) / (max - min)));
    },

    // Calcular nota para tempo de deslocamento (menor = melhor)
    calcularNotaTempo(minutos) {
        if (!minutos) return 5; // Neutro se nao tem dados
        const { otimo, bom, ruim } = this.referencias.tempo;
        if (minutos <= otimo) return 10;
        if (minutos <= bom) return 7;
        if (minutos <= ruim) return 4;
        return 2;
    },

    // Calcular nota para classificacao textual
    calcularNotaClassificacao(tipo, valor) {
        if (!valor) return 5; // Neutro
        const mapa = this.notasClassificacao[tipo];
        if (!mapa) return 5;
        const valorLower = valor.toLowerCase();
        return mapa[valorLower] !== undefined ? mapa[valorLower] : 5;
    },

    // Calcular pontuacao total de um terreno
    calcularPontuacao(terreno) {
        const notas = {
            valor: this.calcularNotaValor(terreno.valor),
            area: this.calcularNotaArea(terreno.area_m2),
            preco_m2: this.calcularNotaPrecoM2(terreno.preco_m2),
            local: this.calcularNotaClassificacao('local', terreno.classificacao?.local),
            seguranca: this.calcularNotaClassificacao('seguranca', terreno.classificacao?.seguranca),
            formato: this.calcularNotaClassificacao('formato', terreno.classificacao?.formato),
            tempo_escritorio: this.calcularNotaTempo(terreno.tempo_escritorio),
            tempo_pais_marina: this.calcularNotaTempo(terreno.tempo_pais_marina),
            tempo_marista: this.calcularNotaTempo(terreno.tempo_marista)
        };

        // Calcular nota ponderada
        let pontuacaoTotal = 0;
        let pesoTotal = 0;

        for (const [criterio, nota] of Object.entries(notas)) {
            const peso = this.pesos[criterio] || 0;
            pontuacaoTotal += nota * peso;
            pesoTotal += peso;
        }

        const notaFinal = pesoTotal > 0 ? (pontuacaoTotal / pesoTotal) : 0;

        return {
            notaFinal: Math.round(notaFinal * 10) / 10,
            notasParciais: notas,
            detalhes: this.gerarDetalhes(notas)
        };
    },

    // Gerar detalhes da pontuacao
    gerarDetalhes(notas) {
        const detalhes = [];
        for (const [criterio, nota] of Object.entries(notas)) {
            const peso = this.pesos[criterio];
            detalhes.push({
                criterio: this.formatarNomeCriterio(criterio),
                nota: nota,
                peso: peso,
                contribuicao: Math.round(nota * peso / 10) / 10
            });
        }
        return detalhes.sort((a, b) => b.contribuicao - a.contribuicao);
    },

    // Formatar nome do criterio para exibicao
    formatarNomeCriterio(criterio) {
        const nomes = {
            valor: 'Valor Total',
            area: 'Area',
            preco_m2: 'Preco/m2',
            local: 'Localizacao',
            seguranca: 'Seguranca',
            formato: 'Formato',
            tempo_escritorio: 'Tempo Escritorio',
            tempo_pais_marina: 'Tempo Pais Marina',
            tempo_marista: 'Tempo Marista'
        };
        return nomes[criterio] || criterio;
    },

    // Obter classe CSS baseada na nota
    getNotaClass(nota) {
        if (nota >= 7) return 'nota-otima';
        if (nota >= 5) return 'nota-boa';
        if (nota >= 3) return 'nota-media';
        return 'nota-ruim';
    },

    // Calcular e salvar pontuacao de todos os terrenos
    calcularTodos() {
        const terrenos = DataManager.getAll();
        terrenos.forEach(terreno => {
            const pontuacao = this.calcularPontuacao(terreno);
            DataManager.update(terreno.id, {
                nota: pontuacao.notaFinal,
                notas_parciais: pontuacao.notasParciais
            });
        });
        return terrenos.length;
    }
};
