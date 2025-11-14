import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const Map = ({ submissions, location }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!mapRef.current) return

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([28.6139, 77.209], 12)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current

    markersRef.current.forEach((marker) => map.removeLayer(marker))
    markersRef.current = []

    // Add user location
    if (location) {
      const userMarker = L.circleMarker([location.lat, location.lng], {
        radius: 8,
        fillColor: "#3B82F6",
        color: "#1F2937",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .bindPopup("Your Location")
        .addTo(map)

      markersRef.current.push(userMarker)
      map.setView([location.lat, location.lng], 14)
    }

    submissions.forEach((submission) => {
      if (submission.location) {
        const markerColor = submission.status === "verified" ? "#10B981" : "#F59E0B"

        const marker = L.circleMarker([submission.location.lat, submission.location.lng], {
          radius: 6,
          fillColor: markerColor,
          color: "#1F2937",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.7,
        })
          .bindPopup(submission.description || "Report")
          .addTo(map)

        markersRef.current.push(marker)
      }
    })
  }, [submissions, location])

  return <div ref={mapRef} className="w-full h-full rounded-lg" />
}

export default Map
