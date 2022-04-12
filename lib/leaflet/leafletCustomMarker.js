class LeafletCustomMarker {
    constructor() {
        
    }

    createMarker(latLng, color) {
		//source for colored icons: https://github.com/pointhi/leaflet-color-markers
        var Icon = new L.Icon({
        	iconUrl: `./img/leaflet-color-markers-master/img/marker-icon-2x-${color}.png`,
        	shadowUrl: './img/leaflet-color-markers-master/img/marker-shadow.png',
        	iconSize: [25, 41],
        	iconAnchor: [12, 41],
        	popupAnchor: [1, -34],
        	shadowSize: [41, 41]
        });

        var marker = L.marker(latLng, {icon: Icon})
        return marker

    }

    createIcon(color) {
		//source for colored icons: https://github.com/pointhi/leaflet-color-markers
        var icon = new L.Icon({
        	iconUrl: `./img/leaflet-color-markers-master/img/marker-icon-2x-${color}.png`,
        	shadowUrl: './img/leaflet-color-markers-master/img/marker-shadow.png',
        	iconSize: [25, 41],
        	iconAnchor: [12, 41],
        	popupAnchor: [1, -34],
        	shadowSize: [41, 41]
        });

        
        return icon

    }

}