export type IndianRegion =
  | "North India"
  | "West India"
  | "South India"
  | "East India"
  | "Central India"

export interface CityOption {
  id: string
  name: string
  region: IndianRegion
  state: string
  lat: number
  lng: number
  zoom?: number
  defaultDivisions?: string[]
}

// Strictly configured cities requested by user grouped by region
export const REGIONAL_CITIES: Record<IndianRegion, CityOption[]> = {
  "North India": [
    {
      id: "delhi",
      name: "Delhi",
      region: "North India",
      state: "Delhi",
      lat: 28.6139,
      lng: 77.209,
      zoom: 11,
      defaultDivisions: [
        "Central Delhi",
        "North Delhi",
        "South Delhi",
        "East Delhi",
        "West Delhi",
        "Dwarka & Airport",
        "Rohini",
        "Noida Border",
      ],
    },
  ],
  "West India": [
    {
      id: "mumbai",
      name: "Mumbai",
      region: "West India",
      state: "Maharashtra",
      lat: 19.076,
      lng: 72.8777,
      zoom: 11,
      defaultDivisions: [
        "South Mumbai",
        "Bandra & BKC",
        "Andheri West",
        "Andheri East & Airport",
        "Borivali & North",
        "Ghatkopar & Kurla",
        "Thane",
        "Navi Mumbai",
      ],
    },
    {
      id: "pune",
      name: "Pune",
      region: "West India",
      state: "Maharashtra",
      lat: 18.5204,
      lng: 73.8567,
      zoom: 12,
      defaultDivisions: [
        "Shivaji Nagar & Central",
        "Kothrud & West",
        "Hinjawadi IT Park",
        "Viman Nagar & Airport",
        "Hadapsar & Magarpatta",
        "Baner & Balewadi",
        "Camp & Swargate",
      ],
    },
  ],
  "South India": [
    {
      id: "bengaluru",
      name: "Bengaluru",
      region: "South India",
      state: "Karnataka",
      lat: 12.9716,
      lng: 77.5946,
      zoom: 11,
      defaultDivisions: [
        "West",
        "Central",
        "Indiranagar",
        "Koramangala",
        "Jayanagar",
        "ORR, Bellandur",
        "Whitefield",
        "South Outer",
        "North Bangalore, Airport",
      ],
    },
    {
      id: "hyderabad",
      name: "Hyderabad",
      region: "South India",
      state: "Telangana",
      lat: 17.385,
      lng: 78.4867,
      zoom: 11,
      defaultDivisions: [
        "Banjara & Jubilee Hills",
        "Hitec City & Gachibowli",
        "Madhapur & Kondapur",
        "Secunderabad",
        "Old City & Charminar",
        "Kukatpally & Miyapur",
        "Begumpet & Ameerpet",
        "Shamshabad & Airport",
      ],
    },
    {
      id: "chennai",
      name: "Chennai",
      region: "South India",
      state: "Tamil Nadu",
      lat: 13.0827,
      lng: 80.2707,
      zoom: 11,
      defaultDivisions: [
        "Central & George Town",
        "T. Nagar & Nungambakkam",
        "Adyar & Besant Nagar",
        "OMR & IT Corridor",
        "Velachery & Guindy",
        "Anna Nagar",
        "Tambaram & Airport",
      ],
    },
    {
      id: "kochi",
      name: "Kochi",
      region: "South India",
      state: "Kerala",
      lat: 9.9312,
      lng: 76.2673,
      zoom: 12,
      defaultDivisions: [
        "Fort Kochi & Mattancherry",
        "Marine Drive & Central",
        "Edappally & Palarivattom",
        "Kakkanad & Infopark",
        "Aluva & Airport Corridor",
        "Tripunithura",
      ],
    },
    {
      id: "mysuru",
      name: "Mysuru",
      region: "South India",
      state: "Karnataka",
      lat: 12.2958,
      lng: 76.6394,
      zoom: 12,
      defaultDivisions: [
        "Palace & Central Mysore",
        "Gokulam & Vontikoppal",
        "Hebbal Industrial Area",
        "Vijayanagar & West",
        "Kuvempunagar & Saraswathipuram",
        "Chamundi Hill & South",
      ],
    },
    {
      id: "mangaluru",
      name: "Mangaluru",
      region: "South India",
      state: "Karnataka",
      lat: 12.9141,
      lng: 74.856,
      zoom: 12,
      defaultDivisions: [
        "Hampankatta & City Centre",
        "Kadri & Bejai",
        "Surathkal & NITK",
        "Kavoor & Airport Road",
        "Ullal & South",
        "Panambur & Port",
      ],
    },
    {
      id: "thiruvananthapuram",
      name: "Thiruvananthapuram",
      region: "South India",
      state: "Kerala",
      lat: 8.5241,
      lng: 76.9366,
      zoom: 12,
      defaultDivisions: [
        "Statue & East Fort (Central)",
        "Kowdiar & Vellayambalam",
        "Kazhakkoottam & Technopark",
        "Pattom & Kesavadasapuram",
        "Kovalam & South Coast",
        "Airport & Shanghumukham",
      ],
    },
  ],
  "East India": [
    {
      id: "kolkata",
      name: "Kolkata",
      region: "East India",
      state: "West Bengal",
      lat: 22.5726,
      lng: 88.3639,
      zoom: 11,
      defaultDivisions: [
        "Central & Esplanade",
        "Park Street & South Kolkata",
        "Salt Lake (Bidhannagar)",
        "New Town & Rajarhat",
        "North Kolkata & Shyambazar",
        "Howrah & Riverfront",
        "Dum Dum & Airport",
      ],
    },
    {
      id: "patna",
      name: "Patna",
      region: "East India",
      state: "Bihar",
      lat: 25.5941,
      lng: 85.1376,
      zoom: 12,
      defaultDivisions: [
        "Dak Bungalow & Fraser Road",
        "Boring Road & Kankarbagh",
        "Patliputra & Digha",
        "Danapur & West",
        "Patna City & East",
        "Bailey Road & Airport",
      ],
    },
    {
      id: "ranchi",
      name: "Ranchi",
      region: "East India",
      state: "Jharkhand",
      lat: 23.3441,
      lng: 85.3096,
      zoom: 12,
      defaultDivisions: [
        "Main Road & Albert Ekka Chowk",
        "Doranda & Hinoo (Airport)",
        "Bariatu & Morabadi",
        "Kanke & North",
        "Harmu & Ashok Nagar",
        "Hatia & Industrial",
      ],
    },
    {
      id: "guwahati",
      name: "Guwahati",
      region: "East India",
      state: "Assam",
      lat: 26.1445,
      lng: 91.7362,
      zoom: 12,
      defaultDivisions: [
        "Panbazar & Fancy Bazar (Central)",
        "GS Road & Dispur (Capital)",
        "Beltola & Six Mile",
        "Jalukbari & IIT Guwahati",
        "Chandmari & Zoo Road",
        "Borjhar & Airport",
      ],
    },
    {
      id: "jamshedpur",
      name: "Jamshedpur",
      region: "East India",
      state: "Jharkhand",
      lat: 22.8046,
      lng: 86.2029,
      zoom: 12,
      defaultDivisions: [
        "Bistupur (Commercial)",
        "Sakchi (Central)",
        "Kadma & Sonari",
        "Telco & Tata Motors",
        "Golmuri & Burmamines",
        "Mango & North",
      ],
    },
  ],
  "Central India": [
    {
      id: "indore",
      name: "Indore",
      region: "Central India",
      state: "Madhya Pradesh",
      lat: 22.7196,
      lng: 75.8577,
      zoom: 12,
      defaultDivisions: [
        "Rajwada & Central",
        "Vijay Nagar & AB Road",
        "Palasia & Old Palasia",
        "Super Corridor & Airport",
        "Bhawarkua & South",
        "Rau & Silicon City",
      ],
    },
    {
      id: "bhopal",
      name: "Bhopal",
      region: "Central India",
      state: "Madhya Pradesh",
      lat: 23.2599,
      lng: 77.4126,
      zoom: 12,
      defaultDivisions: [
        "MP Nagar (Commercial)",
        "New Market & Malviya Nagar",
        "Arera Colony & Shahpura",
        "Bairagarh & Airport",
        "Old City & Upper Lake",
        "Hoshangabad Road & Kolar",
      ],
    },
  ],
}

// Flat list of all supported cities
export const ALL_REGIONAL_CITIES: CityOption[] = Object.values(
  REGIONAL_CITIES
).flat()

// Backward compatible interface and array for spots/new page
export interface City {
  name: string
  lat: number
  lng: number
}

export const CITIES: City[] = ALL_REGIONAL_CITIES.map((c) => ({
  name: c.name,
  lat: c.lat,
  lng: c.lng,
}))

export const DEFAULT_CITY: City = {
  name: "Bengaluru",
  lat: 12.9716,
  lng: 77.5946,
}