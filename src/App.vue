<template>
    <main>
        <div ref="map" class="my-map"></div>
    </main>
</template>

<style lang="scss">
* {
    margin: 0;
    padding: 0;
}

html {
    font-family: sans-serif;
}

html,
body,
main {
    height: 100vh;
}

body {
    display: flex;
    flex-direction: column;
}

main {
    position: relative;
    flex-grow: 1;
    overflow: auto;

    .my-map {
        height: 100%;
        width: 100%;
        z-index: 0;
        cursor: crosshair;
    }
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import "leaflet/dist/leaflet.css";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import * as L from "leaflet";
import "leaflet-providers";
import { LocateControl } from "leaflet.locatecontrol";
import { getAffectedAreas, IAreaInfo, dipulLayerList, wmsUrl } from "./misc/datasvc";

export default defineComponent({
    name: "App",
    data: () => ({
        map: null as null | L.Map,
        affectedAreas: null as IAreaInfo[] | null,
    }),
    async mounted() {
        if (this.map) return;

        const map = L.map(this.$refs.map as HTMLDivElement);
        this.map = map;
        new LocateControl().addTo(map);
        map.setView([49.59, 11], 14);
        map.locate({ setView: true, maxZoom: 14 });
        map.on('click', this.onMapClick);

        L.tileLayer
            .provider('BaseMapDE.Grey')
            .addTo(map);

        L.tileLayer
            .wms(wmsUrl, {
                layers: dipulLayerList.join(","),
                version: "1.3.0",
                format: "image/png",
                transparent: true,
                attribution: 'Source geodata: DFS, BKG 2026'
            })
            .addTo(map);
    },
    beforeUnmount() {
    },
    methods: {
        async onMapClick(ev: L.LeafletMouseEvent) {
            this.affectedAreas = await getAffectedAreas(ev.latlng.lat, ev.latlng.lng);
            if (this.affectedAreas.length == 0) {
                this.affectedAreas = null;
            } else {
                L.popup({
                    closeOnClick: true,
                    autoClose: true
                })
                    .setLatLng(ev.latlng)
                    .setContent(this.prettyAreas?.reduce((p, a) => p += `<p>${a}</p>`, '') || '')
                    .openOn(this.map as L.Map);
            }
        }
    },
    computed: {
        prettyAreas() {
            if (!this.affectedAreas || this.affectedAreas.length == 0) return null;
            return this.affectedAreas.map(a => {
                let items = [];
                items.push(a.typeCode);
                if (a.typeCodeDetail) items.push(a.typeCodeDetail);
                if (a.genNames.length) items.push(a.genNames[0]);
                return items.join(" / ");
            })
        }
    },
    watch: {
    },
    components: {
    }
})
</script>
