function hasLodgingDetails(lodging) {
  if (!lodging) return false
  return Boolean(
    lodging.name?.trim() ||
      lodging.location?.trim() ||
      lodging.notes?.trim() ||
      lodging.checkIn?.trim() ||
      lodging.checkOut?.trim(),
  )
}

export default function LodgingCard({ lodging }) {
  if (!hasLodgingDetails(lodging)) return null

  return (
    <section className="lodging-card" aria-label="Lodging">
      <p className="card-label">Lodging</p>
      {lodging.name && <p className="lodging-name">{lodging.name}</p>}
      {lodging.location && (
        <p className="lodging-detail">{lodging.location}</p>
      )}
      {(lodging.checkIn || lodging.checkOut) && (
        <p className="lodging-detail">
          {[lodging.checkIn, lodging.checkOut].filter(Boolean).join(' – ')}
        </p>
      )}
      {lodging.notes && <p className="lodging-notes">{lodging.notes}</p>}
    </section>
  )
}
