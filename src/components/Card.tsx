"use client"
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getPosterUrl } from '@/lib/images'

export default function Card({ item }: { item: any }) {
  const isTv = (item.media_type || '').includes('tv') || !!item.first_air_date
  const title = item.title || item.name
  const href = `/watch/${item.id}${isTv ? '?type=tv' : '?type=movie'}`
  return (
    <motion.div whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }} className="card overflow-hidden">
      <Link href={href}>
        <div className="relative w-full aspect-[2/3]">
          <Image src={getPosterUrl(item.poster_path)} alt={title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
        </div>
        <div className="p-3 text-sm line-clamp-2">{title}</div>
      </Link>
    </motion.div>
  )
}


