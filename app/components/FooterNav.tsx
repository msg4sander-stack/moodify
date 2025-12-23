'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconFilled,
  MagnifyingGlassIcon as SearchIconFilled,
  UserCircleIcon as UserIconFilled,
  PlusCircleIcon as PlusIconFilled,
} from '@heroicons/react/24/solid'

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: HomeIcon,
    activeIcon: HomeIconFilled,
  },
  {
    href: '/search',
    label: 'Zoeken',
    icon: MagnifyingGlassIcon,
    activeIcon: SearchIconFilled,
  },
  {
    href: '/create',
    label: 'Maken',
    icon: PlusCircleIcon,
    activeIcon: PlusIconFilled,
  },
  {
    href: '/account',
    label: 'Account',
    icon: UserCircleIcon,
    activeIcon: UserIconFilled,
  },
]

export default function FooterNav() {
  const pathname = usePathname()

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-black border-t border-zinc-800 z-50">
      <nav className="flex justify-around items-center h-16 text-xs text-zinc-400">
        {navItems.map(({ href, label, icon: Icon, activeIcon: ActiveIcon }) => {
          const isActive = pathname === href

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-green-400' : 'hover:text-white'
              }`}
            >
              {isActive ? <ActiveIcon className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </footer>
  )
}
