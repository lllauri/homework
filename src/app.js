import Alpine from "alpinejs";
import vehicleData from "./vehicle.js";
import mapData from "./map.js";

Alpine.data("vehicleData", vehicleData);
Alpine.data("mapData", mapData);

window.Alpine = Alpine;
Alpine.start();
