export interface City {
  name: string
  lat: number
  lng: number
}

export const CITIES: City[] = [
  { name: "Bengaluru (Bangalore)", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "New Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Surat", lat: 21.1702, lng: 72.8311 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { name: "Kanpur", lat: 26.4499, lng: 80.3319 },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { name: "Indore", lat: 22.7196, lng: 75.8577 },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
  { name: "Patna", lat: 25.5941, lng: 85.1376 },
  { name: "Vadodara", lat: 22.3072, lng: 73.1812 },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Guwahati", lat: 26.1445, lng: 91.7362 },
  { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366 },
]

export const DEFAULT_CITY = CITIES[0]