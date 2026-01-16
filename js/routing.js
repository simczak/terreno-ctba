// Gerenciamento de Rotas - Calculo de tempo de deslocamento

const RoutingManager = {
    // API Key do OpenRouteService (formato JWT)
    apiKey: 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjliNmVmMjQ4OGI1ODRhMTRhZTZjZGM0Yjc4ODM5OGEzIiwiaCI6Im11cm11cjY0In0=',

    // Destinos de referencia
    destinos: {
        escritorio: {
            nome: "Escritorio",
            lat: -25.4406,
            lng: -49.3419
        },
        paisMarina: {
            nome: "Pais da Marina",
            lat: -25.4113657,
            lng: -49.2558675
        },
        marista: {
            nome: "Marista Sta Maria",
            lat: -25.3897918,
            lng: -49.2683135
        }
    },

    // Cache de tempos calculados
    cache: {},

    // Verificar se API esta configurada
    isConfigured() {
        return true; // Sempre configurada com key hardcoded
    },

    // Calcular tempo de deslocamento para um destino especifico
    async calcularTempo(origem, destinoKey = 'escritorio') {
        if (!origem || !origem.lat || !origem.lng) {
            return { error: 'Coordenadas de origem invalidas' };
        }

        const destino = this.destinos[destinoKey];
        if (!destino) {
            return { error: 'Destino invalido' };
        }

        // Verificar cache
        const cacheKey = `${origem.lat},${origem.lng}-${destinoKey}`;
        if (this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        try {
            // Usar GET com query parameters para evitar problemas de CORS
            const start = `${origem.lng},${origem.lat}`;
            const end = `${destino.lng},${destino.lat}`;
            const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${this.apiKey}&start=${start}&end=${end}`;

            console.log('ORS Request:', {
                url: 'https://api.openrouteservice.org/v2/directions/driving-car',
                origem: `${origem.lat}, ${origem.lng}`,
                destino: `${destino.lat}, ${destino.lng}`,
                destinoNome: destino.nome
            });

            const response = await fetch(url, {
                method: 'GET'
            });

            if (!response.ok) {
                let errorMsg = `Erro API: ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error('Erro ORS:', errorData);
                    if (errorData.error) {
                        errorMsg = errorData.error.message || errorData.error;
                    }
                } catch (e) {
                    console.error('Erro ao parsear resposta:', e);
                }
                console.error(`ORS Request failed: ${response.status} - ${errorMsg}`);
                return { error: errorMsg };
            }

            const data = await response.json();

            // GET endpoint retorna GeoJSON, POST retorna formato diferente
            let duracaoSegundos, distanciaMetros;

            if (data.features && data.features.length > 0) {
                // Formato GeoJSON (GET endpoint)
                const feature = data.features[0];
                duracaoSegundos = feature.properties.summary.duration;
                distanciaMetros = feature.properties.summary.distance;
            } else if (data.routes && data.routes.length > 0) {
                // Formato antigo (POST endpoint)
                const route = data.routes[0];
                duracaoSegundos = route.summary.duration;
                distanciaMetros = route.summary.distance;
            } else {
                return { error: 'Rota nao encontrada' };
            }

            const resultado = {
                duracao_segundos: duracaoSegundos,
                duracao_minutos: Math.round(duracaoSegundos / 60),
                duracao_texto: this.formatarDuracao(duracaoSegundos),
                distancia_metros: distanciaMetros,
                distancia_km: (distanciaMetros / 1000).toFixed(1)
            };

            // Salvar no cache
            this.cache[cacheKey] = resultado;

            return resultado;

        } catch (error) {
            console.error('Erro ao calcular rota:', error);
            return { error: 'Erro de conexao' };
        }
    },

    // Formatar duracao em texto legivel
    formatarDuracao(segundos) {
        const minutos = Math.floor(segundos / 60);
        if (minutos < 60) {
            return `${minutos} min`;
        }
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${horas}h ${mins}min`;
    },

    // Funcao auxiliar para pausa
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Abrir Google Maps com direcoes
    abrirGoogleMapsDirections(origem, destinoKey = 'escritorio') {
        if (!origem || !origem.lat || !origem.lng) {
            alert('Terreno sem coordenadas');
            return;
        }

        const destino = this.destinos[destinoKey];
        const url = `https://www.google.com/maps/dir/${origem.lat},${origem.lng}/${destino.lat},${destino.lng}`;
        window.open(url, '_blank');
    }
};
