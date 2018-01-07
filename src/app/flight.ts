export class Flight {
    constructor() {} 
    id: string;
    latitude: number;
    longitude: number;
    altitude: number;
    baro_altitude: number;
    velocity: number;
    origin_country: string;
    heading: number;
    on_ground: boolean;
    vertical_rate: number;
}