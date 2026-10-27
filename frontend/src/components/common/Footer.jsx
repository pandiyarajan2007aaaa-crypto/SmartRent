import React from "react";
import { Link } from "react-router-dom";
import { Car, ShieldCheck, Clock, Headphones, Award, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Verified Vehicles</h4>
              <p className="text-xs text-slate-400">Regularly inspected & sanitized</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Instant Booking</h4>
              <p className="text-xs text-slate-400">Quick pickup with 0 delay</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Transparent Pricing</h4>
              <p className="text-xs text-slate-400">Clear rates & dynamic value</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">24/7 Roadside Help</h4>
              <p className="text-xs text-slate-400">Support whenever you need</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-sm">
                SR
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Smart<span className="text-teal-400">Rent</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              SmartRent is India&apos;s intelligent vehicle rental management platform, combining AI-driven vehicle recommendations, dynamic pricing algorithms, and an extensive fleet for every journey.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Explore Fleet
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/vehicles?type=SUV" className="hover:text-teal-400 transition-colors">
                  SUVs & Compact Cruisers
                </Link>
              </li>
              <li>
                <Link to="/vehicles?type=Sedan" className="hover:text-teal-400 transition-colors">
                  Executive Sedans
                </Link>
              </li>
              <li>
                <Link to="/vehicles?type=Hatchback" className="hover:text-teal-400 transition-colors">
                  City Hatchbacks
                </Link>
              </li>
              <li>
                <Link to="/vehicles?type=MUV" className="hover:text-teal-400 transition-colors">
                  7-Seater Family MUVs
                </Link>
              </li>
              <li>
                <Link to="/vehicles?fuel=Electric" className="hover:text-teal-400 transition-colors">
                  Electric Vehicles (EV)
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Popular Cities
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {["Madurai", "Chennai", "Bangalore", "Coimbatore", "Hyderabad", "Kochi", "Salem"].map((city) => (
                <span
                  key={city}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300"
                >
                  <MapPin className="w-3 h-3 text-teal-400" />
                  {city}
                </span>
              ))}
            </div>
          </div>

          {/* Rental Terms & Policies */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Rental Policies
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Free cancellation within 1 hour of booking.</li>
              <li>• Standard late fee of ₹100/day applies on overdue returns.</li>
              <li>• Valid driver&apos;s license and government ID required at pickup.</li>
              <li>• Fuel policy: Return at same level as pickup.</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SmartRent Vehicle Rental Management System. All rights reserved.</p>
          <p className="text-slate-400">
            Engineered with modern full-stack performance & analytics.
          </p>
        </div>
      </div>
    </footer>
  );
}
