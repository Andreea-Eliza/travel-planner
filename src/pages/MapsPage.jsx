import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapsPage.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COLORS = ['green', 'blue', 'red', 'orange', 'violet', 'yellow', 'violet', 'grey', 'black'];

// Funcția pentru calcularea distanței Haversine între două puncte (în km)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Algoritmul KNN optimizat pentru walking
const calculateKNNRoute = (points, startIndex = 0, mode = 'car') => {
  if (points.length <= 1) return points.map(p => p.number - 1);

  const unvisited = new Set(Array.from({ length: points.length }, (_, i) => i));
  const route = [startIndex];
  unvisited.delete(startIndex);

  let current = startIndex;

  while (unvisited.size > 0) {
    let nearest = null;
    let minDistance = Infinity;

    // Pentru walking, consideră și "costul" de a merge pe drumuri drepte
    unvisited.forEach(pointIndex => {
      let distance = haversineDistance(
        points[current].lat,
        points[current].lng,
        points[pointIndex].lat,
        points[pointIndex].lng
      );

      // Pentru walking, penalizează direcțiile care sunt prea îndepărtate de direcția curentă
      if (mode === 'walking' && route.length > 1) {
        const prevIndex = route[route.length - 2];
        const bearingChange = calculateBearingChange(
          points[prevIndex].lat, points[prevIndex].lng,
          points[current].lat, points[current].lng,
          points[pointIndex].lat, points[pointIndex].lng
        );
        
        // Penalizează schimbările mari de direcție pentru walking
        if (Math.abs(bearingChange) > 90) {
          distance *= 1.2; // +20% cost pentru viraje bruște
        }
      }

      if (distance < minDistance) {
        minDistance = distance;
        nearest = pointIndex;
      }
    });

    if (nearest !== null) {
      route.push(nearest);
      unvisited.delete(nearest);
      current = nearest;
    }
  }

  return route;
}

// Funcție helper pentru calcularea schimbării de direcție
const calculateBearingChange = (lat1, lon1, lat2, lon2, lat3, lon3) => {
  const bearing1 = calculateBearing(lat1, lon1, lat2, lon2);
  const bearing2 = calculateBearing(lat2, lon2, lat3, lon3);
  return Math.abs(bearing2 - bearing1);
};

const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  
  return (θ * 180 / Math.PI + 360) % 360;
};

// Modifică optimizeRoute pentru a accepta modul de transport
const optimizeRoute = (points, mode = 'car') => {
  if (points.length <= 2) return points;

  let bestRoute = [];
  let bestDistance = Infinity;

  for (let start = 0; start < points.length; start++) {
    const routeIndices = calculateKNNRoute(points, start, mode);

    let totalDistance = 0;
    for (let i = 0; i < routeIndices.length - 1; i++) {
      const p1 = points[routeIndices[i]];
      const p2 = points[routeIndices[i + 1]];
      totalDistance += haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
    }

    if (totalDistance < bestDistance) {
      bestDistance = totalDistance;
      bestRoute = routeIndices;
    }
  }

  return bestRoute.map(index => ({
    ...points[index],
    number: bestRoute.indexOf(index) + 1,
    name: `Punct ${bestRoute.indexOf(index) + 1}`
  }));
};

// ===== ROUTE CACHE (localStorage) =====
const ROUTE_CACHE_KEY = 'routeCache_v1';
const ROUTE_CACHE_MAX = 100; // max entries
const ROUTE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const buildCacheKey = (points, mode) => {
  // Round coords to 4 decimals (~10m precision) so tiny differences hit cache
  const normalized = points.map(p => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
  return `${mode}::${normalized}`;
};

const getCachedRoute = (points, mode) => {
  try {
    const cache = JSON.parse(localStorage.getItem(ROUTE_CACHE_KEY) || '{}');
    const key = buildCacheKey(points, mode);
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ROUTE_CACHE_TTL) {
      delete cache[key];
      localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
};

const setCachedRoute = (points, mode, data) => {
  try {
    const cache = JSON.parse(localStorage.getItem(ROUTE_CACHE_KEY) || '{}');
    const key = buildCacheKey(points, mode);
    cache[key] = { data, timestamp: Date.now() };

    // Evict oldest if over limit
    const keys = Object.keys(cache);
    if (keys.length > ROUTE_CACHE_MAX) {
      const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      sorted.slice(0, keys.length - ROUTE_CACHE_MAX).forEach(k => delete cache[k]);
    }
    localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or unavailable - silent fail
  }
};

const getRouteCacheCount = () => {
  try {
    const cache = JSON.parse(localStorage.getItem(ROUTE_CACHE_KEY) || '{}');
    return Object.keys(cache).length;
  } catch {
    return 0;
  }
};

// ===== HAVERSINE FALLBACK =====
// Builds a route using straight-line segments when API is unavailable
const buildHaversineRoute = (points, mode) => {
  if (points.length < 2) return null;

  const speed = mode === 'walking' ? 4.5 : 60; // km/h: walking 4.5, driving 60
  let totalDistance = 0;
  const coordinates = [];

  for (let i = 0; i < points.length; i++) {
    coordinates.push([points[i].lng, points[i].lat]);
    if (i > 0) {
      totalDistance += haversineDistance(
        points[i - 1].lat, points[i - 1].lng,
        points[i].lat, points[i].lng
      );
    }
  }

  const totalDuration = Math.round((totalDistance / speed) * 60);

  return {
    coordinates,
    distance: totalDistance,
    duration: totalDuration,
    isFallback: true,
  };
};

function MapsPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLineRef = useRef(null);
  const markersRef = useRef([]);

  const [points, setPoints] = useState([]);
  const [travelMode, setTravelMode] = useState('car');
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastCalculatedMode, setLastCalculatedMode] = useState(null);
  const [optimizeEnabled, setOptimizeEnabled] = useState(true);

  // State-uri pentru search simplu
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingAutocomplete, setIsLoadingAutocomplete] = useState(false);

  // State pentru tracking API usage
  const [apiUsage, setApiUsage] = useState({
    directions: 0,
    snap: 0,
    matrix: 0,
    isochrones: 0
  });

  // Initializează harta
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([45.9432, 24.9668], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Efect pentru a recalcula ruta
  useEffect(() => {
    if (points.length >= 2 && routeInfo && travelMode !== lastCalculatedMode) {
      calculateRoute();
    }
  }, [travelMode, points, routeInfo, lastCalculatedMode]);

  // Adaugă acest useEffect pentru a închide dropdown-ul când dai click în afara
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Adaugă punct la click pe hartă
  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      addPoint(lat, lng);
    };

    mapRef.current.on('click', handleMapClick);
    window.addEventListener('removePoint', handleRemovePoint);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
      }
      window.removeEventListener('removePoint', handleRemovePoint);
    };
  }, [points]);

  // Funcție pentru autocomplete
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setAutocompleteResults([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      handleAutocomplete(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAutocomplete = async (query) => {
    if (query.length < 2) return;

    setIsLoadingAutocomplete(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json&limit=8&addressdetails=1&countrycodes=ro&accept-language=ro`
      );

      if (!response.ok) throw new Error('Autocomplete failed');

      const data = await response.json();
      setAutocompleteResults(data);
      setShowSuggestions(true);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Autocomplete error:', error);
      setAutocompleteResults([]);
    } finally {
      setIsLoadingAutocomplete(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClickToCloseDropdown = () => {
      setShowSuggestions(false);
      setAutocompleteResults([]);
    };

    mapRef.current.on('click', handleMapClickToCloseDropdown);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClickToCloseDropdown);
      }
    };
  }, []);

  const handlePlaceSelect = (place) => {
    setSearchQuery(place.display_name);
    setShowSuggestions(false);
    setAutocompleteResults([]);

    if (mapRef.current) {
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);
      mapRef.current.setView([lat, lng], 14);

      addSearchMarker(lat, lng, place.display_name);
    }
  };

  const addSearchMarker = (lat, lng, name) => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker, index) => {
      if (marker && marker.options && marker.options.icon &&
        marker.options.icon.options &&
        marker.options.icon.options.iconUrl &&
        marker.options.icon.options.iconUrl.includes('gold')) {
        marker.remove();
        markersRef.current.splice(index, 1);
      }
    });

    const marker = L.marker([lat, lng], {
      icon: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
        iconSize: [30, 46],
        iconAnchor: [15, 46],
        popupAnchor: [1, -34],
      })
    })
      .addTo(mapRef.current)
      .bindPopup(`
        <div style="padding: 10px; min-width: 250px;">
          <strong>📍 ${name.split(',')[0]}</strong><br>
          <small style="color: #666;">${name.split(',').slice(1, 4).join(',')}</small>
          <br><br>
          <button onclick="
            navigator.clipboard.writeText('${lat}, ${lng}');
            alert('Coordonate copiate!');
          " style="
            background: #4299e1;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            margin-right: 5px;
            margin-bottom: 5px;
          ">
            📋 Copiază coordonate
          </button>
          <button onclick="
            window.dispatchEvent(new CustomEvent('addPointFromSearch', { 
              detail: { lat: ${lat}, lng: ${lng}, name: '${name.split(',')[0].replace(/'/g, "\\'")}' } 
            }));
          " style="
            background: #38a169;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
          ">
            ➕ Adaugă la ruta
          </button>
        </div>
      `);

    markersRef.current.push(marker);
    window.leafletMarkers = markersRef.current;
  };

  useEffect(() => {
    const handleAddPointFromSearch = (e) => {
      const { lat, lng, name } = e.detail;
      
      markersRef.current.forEach((marker, index) => {
        if (marker && marker.options && marker.options.icon && 
            marker.options.icon.options && 
            marker.options.icon.options.iconUrl && 
            marker.options.icon.options.iconUrl.includes('gold')) {
          marker.remove();
          markersRef.current.splice(index, 1);
        }
      });
      
      addPoint(lat, lng, name);
    };

    window.addEventListener('addPointFromSearch', handleAddPointFromSearch);

    return () => {
      window.removeEventListener('addPointFromSearch', handleAddPointFromSearch);
    };
  }, []);

  // FUNCȚIE SNAP V2 - Corectează punctele pe drumuri
  const snapPointsToRoad = async (pointsToSnap, mode) => {
    const API_KEY = import.meta.env.VITE_ORS_API_KEY;
    
    const profileMap = {
      'car': 'driving-car',
      'walking': 'foot-walking'
    };
    const profile = profileMap[mode] || 'driving-car';
    
    const locations = pointsToSnap.map(p => [p.lng, p.lat]);
    
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/snap/${profile}/json`,
        {
          method: 'POST',
          headers: {
            'Authorization': API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locations: locations,
            radius: 350
          })
        }
      );
      
      // Track API usage
      setApiUsage(prev => ({ ...prev, snap: prev.snap + 1 }));
      
      if (!response.ok) {
        throw new Error(`Eroare Snap API: ${response.status}`);
      }
      
      const data = await response.json();
      
      const snappedPoints = [];
      const unreachablePoints = [];
      
      data.locations.forEach((snappedLocation, index) => {
        const originalPoint = pointsToSnap[index];
        
        if (snappedLocation === null) {
          if (import.meta.env.DEV) console.warn(`Punctul ${index + 1} nu a putut fi plasat pe drum.`);
          unreachablePoints.push(originalPoint);
          snappedPoints.push(originalPoint);
        } else {
          snappedPoints.push({
            ...originalPoint,
            lng: snappedLocation.location[0],
            lat: snappedLocation.location[1],
            snappedDistance: snappedLocation.snapped_distance,
            wasSnapped: true
          });
        }
      });
      
      if (unreachablePoints.length > 0) {
        if (import.meta.env.DEV) console.log(`${unreachablePoints.length} punct(e) nu au putut fi corectate pe drum.`);
      }
      
      return snappedPoints;
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('Eroare la corectarea punctelor:', error);
      return pointsToSnap;
    }
  };

  const addPoint = async (lat, lng, customName = null) => {
    const pointNumber = points.length + 1;
    const pointName = customName || `Punct ${pointNumber}`;
    
    const newPoint = {
      id: Date.now() + pointNumber,
      name: pointName,
      lat,
      lng,
      number: pointNumber
    };
    
    // Corectează punctul pe drum imediat
    const snappedPoints = await snapPointsToRoad([newPoint], travelMode);
    const finalPoint = snappedPoints[0];
    
    const markerIndex = points.length;
    
    setPoints(prev => {
      const updatedPoints = [...prev, finalPoint];
      addMarkerToMap(finalPoint.lat, finalPoint.lng, finalPoint.name, markerIndex, finalPoint.wasSnapped);
      return updatedPoints;
    });
  };

  const addMarkerToMap = (lat, lng, name, currentIndex, wasSnapped = false) => {
    if (!mapRef.current) return;

    const iconColor = COLORS[currentIndex % COLORS.length];
    
    // Diferentiere vizuală pentru punctele corectate
    const iconSize = wasSnapped ? [30, 46] : [25, 41];
    const className = wasSnapped ? 'snapped-marker' : '';

    const marker = L.marker([lat, lng], {
      icon: new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${iconColor}.png`,
        iconSize: iconSize,
        iconAnchor: wasSnapped ? [15, 46] : [12, 41],
        popupAnchor: [1, -34],
        className: className
      })
    })
      .addTo(mapRef.current)
      .bindPopup(`
        <div style="padding: 10px; min-width: 200px;">
          <strong>${name}</strong><br>
          Lat: ${lat.toFixed(6)}<br>
          Lng: ${lng.toFixed(6)}
          ${wasSnapped ? '<br><small style="color: #38a169;">✓ Corectat pe drum</small>' : ''}
          <br><br>
          <button onclick="
            window.dispatchEvent(new CustomEvent('removePoint', { detail: ${currentIndex} }));
          " style="
            background: #e53e3e;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">
            Șterge
          </button>
        </div>
      `);

    markersRef.current[currentIndex] = marker;
  };

  const recreateAllMarkers = (pointsArray) => {
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });

    markersRef.current = [];

    pointsArray.forEach((point, index) => {
      addMarkerToMap(point.lat, point.lng, point.name, index, point.wasSnapped);
    });
  };

  const handleRemovePoint = (e) => {
    const index = e.detail;
    removePoint(index);
  };

  const removePoint = (index) => {
    const newPoints = points.filter((_, i) => i !== index);
    const reindexedPoints = newPoints.map((point, i) => ({
      ...point,
      name: `Punct ${i + 1}`,
      number: i + 1
    }));

    setPoints(reindexedPoints);
    recreateAllMarkers(reindexedPoints);
    clearRoute();
    setLastCalculatedMode(null);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} h`;
    }

    return `${hours} h ${remainingMinutes} min`;
  };

  const optimizeRouteWithKNN = async () => {
    if (points.length < 3) {
      alert('Sunt necesare cel puțin 3 puncte pentru optimizare');
      return;
    }

    const optimizedPoints = optimizeRoute(points, travelMode);
    
    // Corectează toate punctele pe drumuri după optimizare
    const snappedOptimizedPoints = await snapPointsToRoad(optimizedPoints, travelMode);
    
    setPoints(snappedOptimizedPoints);
    recreateAllMarkers(snappedOptimizedPoints);
    clearRoute();

    alert(`Traseu optimizat cu algoritmul KNN! Punctele au fost reordonate și corectate pe drumuri.`);
  };

  const calculateRoute = useCallback(async () => {
    if (points.length < 2) return;

    setLoading(true);
    clearRoute();

    try {
      const routePoints = optimizeEnabled ? optimizeRoute(points, travelMode) : points;

      if (travelMode === 'walking') {
        await calculateWalkingRoute(routePoints);
      } else {
        await calculateCarRoute(routePoints);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error calculating route:', error);
      
      if (travelMode !== 'walking') {
        alert('Nu s-a putut calcula ruta. Încearcă din nou.');
      }
    } finally {
      setLoading(false);
    }
  }, [points, travelMode, optimizeEnabled]);

  // Aplica un rezultat de ruta pe harta + setRouteInfo (folosit pentru cache hits si fallback)
  const applyRouteResult = (result, mode) => {
    drawRouteOnMap(result.coordinates, mode);
    setRouteInfo({
      distance: result.distance.toFixed(1),
      duration: result.duration,
      durationFormatted: formatDuration(result.duration),
      points: points.length,
      mode,
      optimized: optimizeEnabled,
      isWalking: mode === 'walking',
      isFallback: !!result.isFallback,
      fromCache: !!result.fromCache,
      pointsSnapped: false,
    });
    setLastCalculatedMode(mode);
  };

  // Funcție separată pentru rutele cu mașina
  const calculateCarRoute = async (routePoints) => {
    // 1. Verifica cache local
    const cached = getCachedRoute(routePoints, 'car');
    if (cached) {
      applyRouteResult({ ...cached, fromCache: true }, 'car');
      return;
    }

    const API_KEY = import.meta.env.VITE_ORS_API_KEY;

    try {
      // PAS 1: Corectează punctele pe drumuri înainte de calcul
      const snappedPoints = await snapPointsToRoad(routePoints, 'car');

      // Folosește punctele corectate pentru routing
      const coordinates = snappedPoints.map(p => [p.lng, p.lat]);

      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
        {
          method: 'POST',
          headers: {
            'Authorization': API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: coordinates,
            instructions: false,
            preference: 'recommended'
          })
        }
      );

      // Track API usage
      setApiUsage(prev => ({ ...prev, directions: prev.directions + 1 }));

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.features?.[0]) {
        const route = data.features[0];
        const geometry = route.geometry;

        const summary = route.properties.summary;
        const result = {
          coordinates: geometry.coordinates,
          distance: summary.distance / 1000,
          duration: Math.round(summary.duration / 60),
        };

        // Salveaza in cache
        setCachedRoute(routePoints, 'car', result);

        applyRouteResult(result, 'car');
      }
    } catch (err) {
      // Fallback Haversine — linie dreapta
      if (import.meta.env.DEV) console.warn('Car routing API failed, using Haversine fallback:', err);
      const fallback = buildHaversineRoute(routePoints, 'car');
      if (fallback) {
        applyRouteResult(fallback, 'car');
      }
    }
  };

  // Funcție pentru rutele pe jos
  const calculateWalkingRoute = async (routePoints) => {
    // 1. Verifica cache local
    const cached = getCachedRoute(routePoints, 'walking');
    if (cached) {
      applyRouteResult({ ...cached, fromCache: true }, 'walking');
      return;
    }

    const API_KEY = import.meta.env.VITE_ORS_API_KEY;

    let snappedPoints;
    try {
      // PAS 1: Corectează punctele pe drumuri pentru pietoni
      snappedPoints = await snapPointsToRoad(routePoints, 'walking');
    } catch {
      snappedPoints = routePoints;
    }

    let allCoordinates = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let anySegmentSucceeded = false;

    for (let i = 0; i < snappedPoints.length - 1; i++) {
      try {
        const startPoint = snappedPoints[i];
        const endPoint = snappedPoints[i + 1];
        
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/foot-walking/geojson`,
          {
            method: 'POST',
            headers: {
              'Authorization': API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coordinates: [
                [startPoint.lng, startPoint.lat],
                [endPoint.lng, endPoint.lat]
              ],
              instructions: false,
              preference: 'recommended'
            })
          }
        );

        // Track API usage
        setApiUsage(prev => ({ ...prev, directions: prev.directions + 1 }));

        if (!response.ok) {
          if (import.meta.env.DEV) console.warn(`Failed to calculate segment ${i+1}, using straight line`);
          allCoordinates.push([startPoint.lng, startPoint.lat]);
          if (i === snappedPoints.length - 2) {
            allCoordinates.push([endPoint.lng, endPoint.lat]);
          }
          
          const segmentDistance = haversineDistance(
            startPoint.lat,
            startPoint.lng,
            endPoint.lat,
            endPoint.lng
          );
          totalDistance += segmentDistance;
          totalDuration += Math.round((segmentDistance / 4.5) * 60);
        } else {
          const data = await response.json();

          if (data.features?.[0]) {
            const route = data.features[0];
            const geometry = route.geometry;

            if (i === 0) {
              allCoordinates.push(...geometry.coordinates);
            } else {
              allCoordinates.push(...geometry.coordinates.slice(1));
            }

            const summary = route.properties.summary;
            totalDistance += summary.distance / 1000;
            totalDuration += Math.round(summary.duration / 60);
            anySegmentSucceeded = true;
          }
        }
        
        if (i < snappedPoints.length - 2) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        if (import.meta.env.DEV) console.error(`Error calculating segment ${i+1}:`, error);
        continue;
      }
    }

    if (anySegmentSucceeded && allCoordinates.length > 0) {
      const result = {
        coordinates: allCoordinates,
        distance: totalDistance,
        duration: totalDuration,
      };
      // Salveaza in cache
      setCachedRoute(routePoints, 'walking', result);
      applyRouteResult(result, 'walking');
    } else {
      // Toate segmentele au esuat — fallback Haversine total
      if (import.meta.env.DEV) console.warn('All walking segments failed, using Haversine fallback');
      const fallback = buildHaversineRoute(routePoints, 'walking');
      if (fallback) {
        applyRouteResult(fallback, 'walking');
      } else {
        throw new Error('Nu s-a putut calcula niciun segment al rutei');
      }
    }
  };

  const drawRouteOnMap = (coordinates, mode = null) => {
    if (!mapRef.current || coordinates.length === 0) return;

    if (routeLineRef.current) {
      mapRef.current.removeLayer(routeLineRef.current);
    }

    const latLngs = coordinates.map(coord => L.latLng(coord[1], coord[0]));

    const routeStyle = mode === 'walking' 
      ? {
          color: '#38A169',
          weight: 6,
          opacity: 0.9,
          lineJoin: 'round',
          dashArray: null,
          className: ''
        }
      : {
          color: '#4299e1',
          weight: 5,
          opacity: 0.7,
          lineJoin: 'round'
        };

    const polyline = L.polyline(latLngs, routeStyle).addTo(mapRef.current);

    routeLineRef.current = polyline;

    const bounds = L.latLngBounds(latLngs);
    mapRef.current.fitBounds(bounds, { 
      padding: [50, 50],
      maxZoom: 18
    });
  };

  const clearRoute = () => {
    if (routeLineRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    setRouteInfo(null);
    setLastCalculatedMode(null);
  };

  const clearAllPoints = () => {
    clearRoute();
    setPoints([]);
    recreateAllMarkers([]);
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Browserul tau nu suporta geolocatia.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          addPoint(latitude, longitude, 'Locatia mea');
          mapRef.current.setView([latitude, longitude], 13);
        }
      },
      (error) => {
        let message;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Acces la locatie refuzat. Activeaza permisiunea din setarile browserului si reincarca pagina.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Locatia ta nu poate fi determinata in acest moment. Verifica daca GPS/wifi e activat.';
            break;
          case error.TIMEOUT:
            message = 'A durat prea mult sa obtinem locatia. Incearca din nou.';
            break;
          default:
            message = 'Nu s-a putut obtine locatia: ' + error.message;
        }
        alert(message);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const exportRoute = () => {
    if (!routeInfo) return;

    let text = `Ruta calculată\n`;
    text += `================\n`;
    text += `Mod de transport: ${travelMode === 'car' ? 'Mașină' : 'Pe jos'}\n`;
    text += `Optimizat cu KNN: ${optimizeEnabled ? 'DA' : 'NU'}\n`;
    text += `Puncte corectate pe drum: ${points.some(p => p.wasSnapped) ? 'DA' : 'NU'}\n`;
    text += `Distanță: ${routeInfo.distance} km\n`;
    text += `Durată: ${routeInfo.durationFormatted || `${routeInfo.duration} minute`}\n`;
    text += `Puncte: ${routeInfo.points}\n\n`;
    text += `Listă puncte (în ordinea optimizată):\n`;

    points.forEach((point, i) => {
      text += `${i + 1}. ${point.name}: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
      if (point.wasSnapped) {
        text += ` (corectat ${point.snappedDistance?.toFixed(1)}m)`;
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    alert('Ruta a fost copiată în clipboard!');
  };

  // Efect pentru recalculare automată
  useEffect(() => {
    if (points.length >= 2 && routeInfo) {
      calculateRoute();
    }
  }, [optimizeEnabled]);

  return (
    <div className="maps-page">

      <div className="search-container">
        <div className="search-wrapper">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Caută locații, orașe, străzi... (ex: București, Piața Romană)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.length >= 2) {
                  setShowSuggestions(true);
                }
              }}
              className="search-input"
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  setAutocompleteResults([]);
                  setShowSuggestions(false);
                  markersRef.current.forEach((marker, index) => {
                    if (marker && marker.options && marker.options.icon && 
                        marker.options.icon.options && 
                        marker.options.icon.options.iconUrl && 
                        marker.options.icon.options.iconUrl.includes('gold')) {
                      marker.remove();
                      markersRef.current.splice(index, 1);
                    }
                  });
                }}
                className="clear-search-btn"
                title="Șterge căutarea"
              >
                ✕
              </button>
            )}
            {isLoadingAutocomplete && (
              <div className="autocomplete-loading">
                <div className="loading-spinner-small"></div>
              </div>
            )}
          </div>

          {showSuggestions && autocompleteResults.length > 0 && (
            <div 
              className="autocomplete-suggestions"
              onClick={(e) => e.stopPropagation()}
            >
              {autocompleteResults.map((place, index) => (
                <div
                  key={place.place_id || index}
                  className="suggestion-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlaceSelect(place);
                  }}
                  onMouseEnter={() => {
                    if (mapRef.current) {
                      const lat = parseFloat(place.lat);
                      const lng = parseFloat(place.lon);
                      mapRef.current.setView([lat, lng], 14, { animate: true });
                    }
                  }}
                >
                  <div className="suggestion-icon">
                    {place.type === 'city' || place.type === 'town' ? '🏙️' :
                      place.type === 'village' ? '🏘️' :
                        place.type === 'administrative' ? '🏛️' :
                          place.class === 'amenity' ? '📍' : '📍'}
                  </div>
                  <div className="suggestion-content">
                    <div className="suggestion-name">{place.display_name.split(',')[0]}</div>
                    <div className="suggestion-address">
                      {place.display_name.split(',').slice(1, 3).join(',')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="maps-main">
        <div className="map-section">
          <div ref={mapContainerRef} className="map-container" />

        </div>

        <div className="controls-panel">
          <div className="control-section">
            <h3>⚙️ Setări Ruta</h3>

            <div className="control-item">
              <div className="optimize-row">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={optimizeEnabled}
                    onChange={(e) => setOptimizeEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">Activeaza optimizarea</span>
                {points.length >= 3 && (
                  <button onClick={optimizeRouteWithKNN} className="btn-small">
                    Reordoneaza
                  </button>
                )}
              </div>
            </div>

            <div className="control-item">
              <label>Mod de transport:</label>
              <div className="mode-selector">
                <button
                  className={`mode-btn ${travelMode === 'car' ? 'active' : ''}`}
                  onClick={() => setTravelMode('car')}
                  disabled={loading || points.length < 2}
                >
                  🚗 Mașină
                </button>
                <button
                  className={`mode-btn ${travelMode === 'walking' ? 'active' : ''}`}
                  onClick={() => setTravelMode('walking')}
                  disabled={loading || points.length < 2}
                >
                  🚶‍♂️ Pe jos
                </button>
              </div>
              <p className="control-hint">Punctele vor fi corectate pe drumuri pentru modul selectat</p>
            </div>

            <div className="control-item">
              <label>Puncte adăugate: {points.length}</label>
              {points.length > 0 && (
                <div className="points-list">
                  {points.slice(0, 5).map((point, i) => (
                    <div key={point.id} className="point-item">
                      <span
                        className={`point-number ${point.wasSnapped ? 'snapped' : ''}`}
                        style={{ backgroundColor: COLORS[i % COLORS.length], color: 'white' }}
                      >
                        {i + 1}
                      </span>
                      <span className="point-name">{point.name}</span>
                      {point.wasSnapped && <span className="point-snapped-badge">✓</span>}
                      <span className="point-coords">
                        {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                      </span>
                      <button
                        onClick={() => removePoint(i)}
                        className="point-remove"
                      >
                        Șterge
                      </button>
                    </div>
                  ))}
                  {points.length > 5 && (
                    <div className="more-points">... și încă {points.length - 5} puncte</div>
                  )}
                </div>
              )}
            </div>

            <div className="control-buttons">
              <button
                onClick={calculateRoute}
                disabled={loading || points.length < 2}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Se calculează...
                  </>
                ) : (
                  `🚀 Calculează Ruta ${optimizeEnabled ? 'cu KNN' : ''}`
                )}
              </button>

              <button
                onClick={clearAllPoints}
                disabled={points.length === 0}
                className="btn-secondary"
              >
                🗑️ Șterge toate
              </button>
            </div>

            <div className="quick-actions">
              <button onClick={getUserLocation} className="btn-small">
                📍 Locația mea
              </button>
              <Link to="/" className="btn-small">
                ← Înapoi
              </Link>
            </div>
          </div>

          {/* Route results */}
          {routeInfo && (
            <div className="results-section">
              <h3>📊 Rezultate Ruta</h3>
              <div className="results-grid">
                <div className="result-item">
                  <div className="result-label">Optimizare KNN:</div>
                  <div className="result-value">
                    {routeInfo.optimized ? '✓ ACTIVATĂ' : '✗ DEZACTIVATĂ'}
                  </div>
                </div>
                <div className="result-item">
                  <div className="result-label">Mod transport:</div>
                  <div className="result-value">
                    {routeInfo.mode === 'car' ? '🚗 Mașină' : '🚶‍♂️ Pe jos'}
                  </div>
                </div>
                <div className="result-item">
                  <div className="result-label">Puncte corectate:</div>
                  <div className="result-value">
                    {routeInfo.pointsSnapped ? '✓ DA' : '✗ NU'}
                  </div>
                </div>
                <div className="result-item">
                  <div className="result-label">Distanță:</div>
                  <div className="result-value">{routeInfo.distance} km</div>
                </div>
                <div className="result-item">
                  <div className="result-label">Timp estimat:</div>
                  <div className="result-value">{routeInfo.durationFormatted}</div>
                </div>
              </div>

              <button onClick={exportRoute} className="btn-export">
                📋 Exportă detaliile
              </button>
            </div>
          )}

          {/* API Usage Info */}
          <div className="api-usage">
            <h4>Utilizare API OpenRouteService</h4>
            <div className="api-usage-rows">
              <div className="api-usage-row">
                <span>Directions V2</span>
                <span><strong>{apiUsage.directions}</strong> / 2000</span>
              </div>
              <div className="api-usage-row">
                <span>Snap V2</span>
                <span><strong>{apiUsage.snap}</strong> / 2000</span>
              </div>
              <div className="api-usage-row">
                <span>Matrix V2</span>
                <span><strong>{apiUsage.matrix}</strong> / 500</span>
              </div>
              <div className="api-usage-row">
                <span>Isochrones V2</span>
                <span><strong>{apiUsage.isochrones}</strong> / 500</span>
              </div>
              <div className={`api-usage-row cache-row ${getRouteCacheCount() >= 90 ? 'warning' : ''}`}>
                <span>Rute in cache</span>
                <span><strong>{getRouteCacheCount()}</strong> / 100</span>
              </div>
            </div>
            {getRouteCacheCount() >= 90 && (
              <p className="api-usage-warning">Cache aproape plin — rutele cele mai vechi vor fi sterse automat.</p>
            )}
            <p className="api-usage-note">Quota se reseteaza la fiecare 24 de ore</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapsPage;