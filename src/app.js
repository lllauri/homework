import Alpine from "alpinejs";
import vehicleData from "./vehicle.js";
import mapData from "./map.js";

// const BING_API_KEY = 'AgwSYkppdQGrY2sqlItG9JIhgDK51KFIRQlWvI54WbQdJHfK49aBlb0H-smMBwt1';

Alpine.data("vehicleData", vehicleData);
Alpine.data("mapData", mapData);

window.Alpine = Alpine;
Alpine.start();
