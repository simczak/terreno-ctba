// Gerenciamento do Mapa - Leaflet

const MapManager = {
    map: null,
    markers: [],
    markerLayer: null,
    isFullscreen: false,

    // Centro de Curitiba
    defaultCenter: [-25.4284, -49.2733],
    defaultZoom: 12,

    // Camadas do mapa
    layers: {
        street: null,
        satellite: null
    },

    // Inicializar o mapa
    init() {
        // Criar o mapa
        this.map = L.map('map').setView(this.defaultCenter, this.defaultZoom);

        // Camada de ruas (OpenStreetMap)
        this.layers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        });

        // Camada de satelite (Esri World Imagery - gratuito)
        this.layers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri, Maxar, Earthstar Geographics',
            maxZoom: 19
        });

        // Adicionar camada de ruas por padrao
        this.layers.street.addTo(this.map);

        // Adicionar controle de camadas
        const baseMaps = {
            "Mapa": this.layers.street,
            "Satelite": this.layers.satellite
        };
        L.control.layers(baseMaps, null, { position: 'topright' }).addTo(this.map);

        // Criar camada para os marcadores
        this.markerLayer = L.layerGroup().addTo(this.map);

        // Adicionar botao de fullscreen
        this.addFullscreenControl();

        return this;
    },

    // Adicionar controle de fullscreen customizado
    addFullscreenControl() {
        const FullscreenControl = L.Control.extend({
            options: { position: 'topleft' },

            onAdd: function(map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                const button = L.DomUtil.create('a', 'fullscreen-btn', container);
                button.href = '#';
                button.title = 'Tela cheia';
                button.innerHTML = '⛶';
                button.style.cssText = 'font-size: 18px; line-height: 26px; width: 30px; height: 30px; display: block; text-align: center; text-decoration: none; color: #333; background: white;';

                L.DomEvent.on(button, 'click', function(e) {
                    L.DomEvent.preventDefault(e);
                    MapManager.toggleFullscreen();
                });

                return container;
            }
        });

        this.map.addControl(new FullscreenControl());
    },

    // Alternar modo fullscreen
    toggleFullscreen() {
        const mapSection = document.querySelector('.map-section');
        const mapContainer = document.getElementById('map');

        if (!this.isFullscreen) {
            // Entrar em fullscreen
            mapSection.classList.add('map-fullscreen');
            document.body.style.overflow = 'hidden';
            this.isFullscreen = true;

            // Adicionar botao de fechar
            if (!document.getElementById('closeFullscreenBtn')) {
                const closeBtn = document.createElement('button');
                closeBtn.id = 'closeFullscreenBtn';
                closeBtn.innerHTML = '✕ Fechar';
                closeBtn.className = 'btn btn-danger';
                closeBtn.style.cssText = 'position: absolute; top: 10px; right: 60px; z-index: 1001;';
                closeBtn.onclick = () => this.toggleFullscreen();
                mapSection.appendChild(closeBtn);
            }
        } else {
            // Sair de fullscreen
            mapSection.classList.remove('map-fullscreen');
            document.body.style.overflow = '';
            this.isFullscreen = false;

            // Remover botao de fechar
            const closeBtn = document.getElementById('closeFullscreenBtn');
            if (closeBtn) closeBtn.remove();
        }

        // Atualizar tamanho do mapa
        setTimeout(() => {
            this.map.invalidateSize();
            if (this.markers.length > 0) {
                this.fitBounds();
            }
        }, 100);
    },

    // Criar marcador customizado com preco e area
    createCustomMarker(terreno) {
        // Determinar classe CSS baseada no valor_meta
        let markerClass = 'bom';
        if (terreno.classificacao) {
            const valorMeta = terreno.classificacao.valor_meta || '';
            if (valorMeta.toLowerCase() === 'otimo') {
                markerClass = 'otimo';
            } else if (valorMeta.toLowerCase() === 'acima') {
                markerClass = 'acima';
            }
        }

        // Formatar valor para exibicao
        const valorFormatado = this.formatValorCurto(terreno.valor);
        const areaFormatada = formatNumber(terreno.area_m2);

        // Criar HTML do marcador
        const markerHtml = `
            <div class="custom-marker ${markerClass}">
                <div class="marker-price">${valorFormatado}</div>
                <div class="marker-area">${areaFormatada} m2</div>
            </div>
        `;

        // Criar icone customizado
        const customIcon = L.divIcon({
            html: markerHtml,
            className: 'marker-container',
            iconSize: [80, 40],
            iconAnchor: [40, 40],
            popupAnchor: [0, -40]
        });

        return customIcon;
    },

    // Formatar valor de forma curta (ex: 1.5M)
    formatValorCurto(valor) {
        if (valor >= 1000000) {
            return `R$ ${(valor / 1000000).toFixed(1)}M`;
        } else if (valor >= 1000) {
            return `R$ ${(valor / 1000).toFixed(0)}K`;
        }
        return `R$ ${valor}`;
    },

    // Criar conteudo do popup
    createPopupContent(terreno) {
        const valor = formatCurrency(terreno.valor);
        const precoM2 = formatCurrency(terreno.preco_m2);
        const area = formatNumber(terreno.area_m2);

        let linksHtml = '';
        if (terreno.link_maps) {
            linksHtml += `<a href="${terreno.link_maps}" target="_blank" class="btn btn-primary btn-small">Google Maps</a>`;
        }
        if (terreno.link_anuncio) {
            linksHtml += `<a href="${terreno.link_anuncio}" target="_blank" class="btn btn-secondary btn-small">Ver Anuncio</a>`;
        }

        // Criar badges de classificacao
        let classificacaoHtml = '';
        if (terreno.classificacao) {
            const c = terreno.classificacao;
            classificacaoHtml = `
                <p><strong>Local:</strong> ${this.getBadgeHtml(c.local)}</p>
                <p><strong>Seguranca:</strong> ${this.getBadgeHtml(c.seguranca)}</p>
                <p><strong>Formato:</strong> ${this.getBadgeHtml(c.formato)}</p>
            `;
        }

        return `
            <div class="popup-content">
                <h4>${terreno.bairro}</h4>
                <p>${terreno.endereco}</p>
                <p class="popup-price">${valor}</p>
                <p><strong>Area:</strong> ${area} m2</p>
                <p><strong>Preco/m2:</strong> ${precoM2}</p>
                ${classificacaoHtml}
                ${terreno.observacoes ? `<p><em>${terreno.observacoes}</em></p>` : ''}
                <div class="popup-actions">
                    ${linksHtml}
                    <button class="btn btn-primary btn-small" onclick="App.editTerreno(${terreno.id})">Editar</button>
                </div>
            </div>
        `;
    },

    // Obter HTML do badge baseado no valor
    getBadgeHtml(valor) {
        if (!valor) return '';

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

    // Adicionar marcadores dos terrenos
    addMarkers(terrenos) {
        // Limpar marcadores existentes
        this.clearMarkers();

        // Adicionar novos marcadores
        terrenos.forEach(terreno => {
            if (terreno.coordenadas && terreno.coordenadas.lat && terreno.coordenadas.lng) {
                const marker = L.marker(
                    [terreno.coordenadas.lat, terreno.coordenadas.lng],
                    { icon: this.createCustomMarker(terreno) }
                );

                marker.bindPopup(this.createPopupContent(terreno), {
                    maxWidth: 300
                });

                marker.terrenoId = terreno.id;
                marker.addTo(this.markerLayer);
                this.markers.push(marker);
            }
        });

        // Ajustar zoom para mostrar todos os marcadores
        if (this.markers.length > 0) {
            this.fitBounds();
        }
    },

    // Limpar todos os marcadores
    clearMarkers() {
        this.markerLayer.clearLayers();
        this.markers = [];
    },

    // Ajustar zoom para mostrar todos os marcadores
    fitBounds() {
        if (this.markers.length === 0) return;

        const group = L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
    },

    // Centralizar em um terreno especifico
    focusOnTerreno(id) {
        const marker = this.markers.find(m => m.terrenoId === id);
        if (marker) {
            this.map.setView(marker.getLatLng(), 15);
            marker.openPopup();
        }
    },

    // Atualizar marcador de um terreno
    updateMarker(terreno) {
        const markerIndex = this.markers.findIndex(m => m.terrenoId === terreno.id);

        if (markerIndex !== -1) {
            // Remover marcador antigo
            this.markerLayer.removeLayer(this.markers[markerIndex]);

            // Criar novo marcador se tiver coordenadas
            if (terreno.coordenadas && terreno.coordenadas.lat && terreno.coordenadas.lng) {
                const newMarker = L.marker(
                    [terreno.coordenadas.lat, terreno.coordenadas.lng],
                    { icon: this.createCustomMarker(terreno) }
                );

                newMarker.bindPopup(this.createPopupContent(terreno), {
                    maxWidth: 300
                });

                newMarker.terrenoId = terreno.id;
                newMarker.addTo(this.markerLayer);
                this.markers[markerIndex] = newMarker;
            } else {
                // Remover da lista se nao tiver coordenadas
                this.markers.splice(markerIndex, 1);
            }
        } else if (terreno.coordenadas && terreno.coordenadas.lat && terreno.coordenadas.lng) {
            // Adicionar novo marcador
            const marker = L.marker(
                [terreno.coordenadas.lat, terreno.coordenadas.lng],
                { icon: this.createCustomMarker(terreno) }
            );

            marker.bindPopup(this.createPopupContent(terreno), {
                maxWidth: 300
            });

            marker.terrenoId = terreno.id;
            marker.addTo(this.markerLayer);
            this.markers.push(marker);
        }
    },

    // Remover marcador de um terreno
    removeMarker(id) {
        const markerIndex = this.markers.findIndex(m => m.terrenoId === id);
        if (markerIndex !== -1) {
            this.markerLayer.removeLayer(this.markers[markerIndex]);
            this.markers.splice(markerIndex, 1);
        }
    },

    // Invalidar tamanho do mapa (util apos redimensionamento)
    invalidateSize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }
};
