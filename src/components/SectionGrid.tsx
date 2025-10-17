import Card from '@/components/Card'

export default function SectionGrid({ title, items }: { title: string; items: any[] }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((it) => (
          <Card key={`${it.media_type || it.title}-${it.id}`} item={it} />
        ))}
      </div>
    </section>
  )
}


