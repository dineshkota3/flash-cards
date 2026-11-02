import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home' },
  { to: '/review', label: 'Pile' },
  { to: '/stats', label: 'Stats' },
]

export function TabBar() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 border-t border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[26rem]">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 py-2 text-center text-[12px] font-medium ${
                isActive ? 'text-iosblue' : 'text-iosgray'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
