{student.report && (
  <section aria-label={`משוב עבור ${student.studentName}`}>
    <p>{student.report.explanation || ''}</p>
    
    {student.report.improvements?.length > 0 && (
      <>
        <h3>מה כדאי לשפר</h3>
        <ul>
          {student.report.improvements.map((item, index) => (
            <li key={`improvement-${index}`}>{item}</li>
          ))}
        </ul>
      </>
    )}

    <p>{student.report.encouragement || ''}</p>

    {student.report.items?.map((item, index) => (
      <p key={`item-${item?.part || index}-${index}`}>
        {item?.item || 'סעיף'}: {item?.accuracy ?? 0}%
        {item?.improvements?.length > 0 ? ` | ${item.improvements.join(', ')}` : ''}
      </p>
    ))}
  </section>
)}
export default SessionHistory;