import { Link, useLocation } from 'react-router-dom'

export function NavBar() {
  const location = useLocation()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/people', label: 'People' },
  ]

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex items-center gap-6 shadow-md">
      <span className="text-lg font-bold text-blue-400">Shmirot</span>
      {links.map(link => (
        <Link
          key={link.to}
          to={link.to}
          className={`hover:text-blue-300 transition-colors ${
            location.pathname === link.to ? 'text-blue-300 font-medium' : 'text-gray-300'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
