import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, TrendingUp, Cpu, QrCode, Ticket, Clock, AlertCircle, Percent, CheckCircle2, 
  BarChart as ChartIcon, Zap, Filter, Search, ChevronRight, Activity, ArrowUpRight, Users, Bell,
  Smartphone, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { BOOKING_SLOTS, TEMPLES } from '@/lib/data';
import { cn, formatNumber } from '@/lib/utils';
import { showToast } from '@/components/ui/Toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useBridgeSync } from '@/hooks/useBridgeSync';

export default function BookingManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemple, setSelectedTemple] = useState('all');

  // 🔄 Live bridge sync — polls localhost:8000 every 5s
  const bridge = useBridgeSync(5000);

  // Use bridge slots if connected (they include mobile booking counts), else fallback to static
  const activeSlots = bridge.connected && bridge.slots.length > 0 ? bridge.slots : BOOKING_SLOTS;

  const filteredSlots = useMemo(() => {
    return activeSlots.filter(slot => {
      const matchSearch = slot.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTemple = selectedTemple === 'all' || slot.templeId === selectedTemple;
      return matchSearch && matchTemple;
    }).sort((a, b) => (b.booked / b.capacity) - (a.booked / a.capacity));
  }, [searchQuery, selectedTemple, activeSlots]);

  // Aggregate stats — includes live mobile bookings
  const totalCapacity = activeSlots.reduce((acc, slot) => acc + slot.capacity, 0);
  const totalBooked = activeSlots.reduce((acc, slot) => acc + slot.booked, 0);
  const utilizationPercent = Math.round((totalBooked / totalCapacity) * 100);

  // Hourly curve mock data
  const hourlyData = [
    { time: '06:00', bookings: 1200, capacity: 1500 },
    { time: '08:00', bookings: 2800, capacity: 3000 },
    { time: '10:00', bookings: 3400, capacity: 3000 },
    { time: '12:00', bookings: 2100, capacity: 2500 },
    { time: '14:00', bookings: 1800, capacity: 2500 },
    { time: '16:00', bookings: 2900, capacity: 3000 },
    { time: '18:00', bookings: 4100, capacity: 4000 },
    { time: '20:00', bookings: 1500, capacity: 2000 },
  ];

  const getRiskStyles = (fillRate: number) => {
    if (fillRate >= 98) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-l-red-500', bar: 'bg-red-500', alert: true };
    if (fillRate >= 90) return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-l-orange-500', bar: 'bg-orange-500', alert: false };
    if (fillRate >= 75) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-l-amber-500', bar: 'bg-amber-500', alert: false };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500', bar: 'bg-emerald-500', alert: false };
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden bg-[#F8F8F5] min-h-screen relative pb-12 font-sans">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none z-0" />

      <div className="relative z-10 w-full px-4 space-y-4 pt-4">
        
        {/* ROW 1: HEADER & KPIs */}
        <div className="flex flex-col xl:flex-row justify-between items-stretch gap-4 bg-white border border-slate-200 p-3 xl:px-4 xl:py-2.5 rounded-xl shadow-sm">
          {/* TITLE */}
          <div className="flex items-center gap-3 w-full xl:w-[32%] shrink-0 xl:border-r border-slate-200 xl:pr-4">
            <Ticket className="w-6 h-6 text-primary shrink-0" />
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[14px] font-black text-[#0E1A2B] uppercase tracking-tight leading-none truncate">
                  Booking Operations
                </h1>
              </div>
              <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase leading-none mt-1.5 truncate">
                Live Capacity • AI Overflow Prediction • Access Control
              </p>
            </div>
          </div>
          
          {/* KPIs */}
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            {[
              { t: 'Total Cap', v: formatNumber(totalCapacity), c: 'text-[#0E1A2B]' },
              { t: 'Booked', v: formatNumber(totalBooked), c: 'text-blue-600' },
              { t: 'Utilization', v: `${utilizationPercent}%`, c: utilizationPercent > 90 ? 'text-red-600' : 'text-emerald-600' },
              { t: 'Peak Predict', v: '112%', c: 'text-orange-600' },
              { t: 'QR Auth', v: '42.8k', c: 'text-slate-600' },
            ].map((m, i) => (
              <div key={i} className="flex flex-col justify-center min-w-0 flex-1">
                <div className="text-[8px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1 truncate">{m.t}</div>
                <div className={cn("text-[15px] font-black tracking-tight leading-none truncate", m.c)}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2: MAIN WORKSPACE (70/30) */}
        <div className="flex flex-col xl:flex-row gap-4 items-start w-full">
          
          {/* LEFT COLUMN: 70% */}
          <div className="w-full xl:w-[70%] space-y-4 shrink-0">
            
            {/* ENTERPRISE FILTERS */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Filters</span>
              </div>
              <div className="flex flex-wrap gap-2 flex-1 justify-end">
                <select 
                  className="bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-[#0E1A2B] px-3 py-1.5 outline-none min-w-[140px]"
                  value={selectedTemple}
                  onChange={(e) => setSelectedTemple(e.target.value)}
                >
                  <option value="all">All Temples</option>
                  <option value="somnath">Somnath</option>
                  <option value="dwarka">Dwarka</option>
                  <option value="ambaji">Ambaji</option>
                </select>
                <select className="bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-[#0E1A2B] px-3 py-1.5 outline-none min-w-[120px]">
                  <option>All Risk Levels</option>
                  <option>Critical (&gt;98%)</option>
                  <option>High (&gt;90%)</option>
                </select>
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search slots..." 
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-[#0E1A2B] outline-none placeholder:text-slate-400 w-[160px]"
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>
            </div>

            {/* BOOKING CARDS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSlots.map((slot, idx) => {
                const fillRate = Math.round((slot.booked / slot.capacity) * 100);
                const styles = getRiskStyles(fillRate);

                return (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "bg-white border-y border-r border-l-[4px] rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col",
                      styles.border
                    )}
                  >
                    {/* Header */}
                    <div className="p-3 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[12px] font-black text-[#0E1A2B] truncate">{TEMPLES[slot.templeId].name}</h3>
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 font-bold uppercase tracking-widest">{slot.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <Clock className="w-3 h-3" /> {slot.time}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Fill Rate</div>
                        <div className={cn("text-[16px] font-black leading-none", styles.color)}>{fillRate}%</div>
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div className="p-3 space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1.5">
                          <span className="text-[#0E1A2B]">{formatNumber(slot.booked)} Booked</span>
                          <span className="text-slate-400">{formatNumber(slot.capacity - slot.booked)} Remaining</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
                          <div className={cn("h-full transition-all duration-1000 ease-out", styles.bar)} style={{ width: `${Math.min(fillRate, 100)}%` }} />
                        </div>
                      </div>

                      {/* Micro Stats */}
                      <div className="flex gap-2">
                        <div className="flex-1 bg-slate-50 rounded p-2 border border-slate-100">
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Est. Queue</div>
                          <div className="text-[11px] font-black text-[#0E1A2B]">~{Math.round(slot.booked * 0.4)}m</div>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded p-2 border border-slate-100">
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Predicted Wait</div>
                          <div className="text-[11px] font-black text-[#0E1A2B]">{Math.max(15, Math.round((fillRate / 100) * 45))} mins</div>
                        </div>
                      </div>

                      {/* AI Recommendation */}
                      <div className={cn("rounded-lg p-2.5 flex gap-2 items-start border", styles.bg, styles.border.replace('border-l-','border-').replace('500','200'))}>
                        <Cpu className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", styles.color)} />
                        <div>
                          <div className={cn("text-[8px] font-bold uppercase tracking-widest mb-0.5", styles.color)}>AI Recommendation • 92% Conf</div>
                          <div className="text-[10px] font-bold text-[#0E1A2B] leading-tight">{slot.aiRecommendation}</div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action */}
                    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                      <button onClick={() => showToast(`Managing ${slot.type} slot — ${slot.booked}/${slot.capacity} booked`, 'info')} className="text-[9px] font-bold text-slate-600 hover:text-[#0E1A2B] uppercase tracking-widest flex items-center gap-1 transition-colors bg-white border border-slate-200 px-2 py-1 rounded">
                        Manage Slot <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* BOTTOM WIDGETS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" /> Hourly Booking Curve
                </h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF9933" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FF9933" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="bookings" stroke="#FF9933" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" /> Overflow & Walk-ins
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">Unreserved Walk-ins</span>
                      <span className="text-[#0E1A2B]">4,250 (Trending Up)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-blue-500 h-full rounded-full w-[65%]" /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">VIP Waitlist</span>
                      <span className="text-[#0E1A2B]">142 Requested</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-purple-500 h-full rounded-full w-[82%]" /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-500">No-shows (Est)</span>
                      <span className="text-[#0E1A2B]">4.2% Average</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-slate-400 h-full rounded-full w-[12%]" /></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: 30% STICKY */}
          <div className="w-full xl:w-[30%] shrink-0">
            <div className="sticky top-4 space-y-4">
              
              {/* AI BOOKING ADVISOR */}
              <div className="bg-[#0E1A2B] rounded-xl p-4 shadow-sm border border-slate-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><Cpu className="w-24 h-24 -rotate-12"/></div>
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 relative z-10">
                  <Zap className="w-3.5 h-3.5 text-primary" /> AI Booking Advisor
                </h2>
                
                <div className="space-y-3 relative z-10">
                  <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      <div className="text-[11px] font-black leading-tight text-white">Somnath Aarti nearly full</div>
                    </div>
                    <div className="text-[9px] text-slate-300 font-medium mb-3">Model predicts 115% demand vs capacity. Recommending overflow quota.</div>
                    <div className="flex justify-between items-center">
                      <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Impact: High</div>
                      <button onClick={() => showToast('Overflow quota enabled — capacity increased by 10%', 'success')} className="bg-primary hover:bg-primary/90 text-white text-[9px] font-bold px-3 py-1.5 rounded uppercase tracking-widest transition-colors">
                        Enable +10%
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                      <div className="text-[11px] font-black leading-tight text-white">Dwarka VIP Overflow</div>
                    </div>
                    <div className="text-[9px] text-slate-300 font-medium mb-3">VIP waitlist exceeds normal limits. Suggesting auxiliary waiting list.</div>
                    <div className="flex justify-between items-center">
                      <div className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Impact: Med</div>
                      <button onClick={() => showToast('VIP auxiliary waitlist opened — 142 requests queued', 'info')} className="bg-white/20 hover:bg-white/30 text-white text-[9px] font-bold px-3 py-1.5 rounded uppercase tracking-widest transition-colors">
                        Open List
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              </div>

              {/* 📱 LIVE MOBILE BOOKINGS — from bridge server */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                  Mobile App Bookings
                  <span className={cn(
                    'ml-auto text-[8px] font-bold px-2 py-0.5 rounded-full',
                    bridge.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  )}>
                    {bridge.connected ? (
                      <span className="flex items-center gap-1"><Wifi className="w-2.5 h-2.5" /> LIVE</span>
                    ) : (
                      <span className="flex items-center gap-1"><WifiOff className="w-2.5 h-2.5" /> Offline</span>
                    )}
                  </span>
                </h2>

                {bridge.mobileBookings.length === 0 ? (
                  <div className="text-center py-6">
                    <Smartphone className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <div className="text-[10px] text-slate-400 font-medium">
                      {bridge.connected
                        ? 'No mobile bookings yet. Book a slot on the app!'
                        : 'Bridge server offline. Run: cd bridge-server && node server.js'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bridge.mobileBookings.slice(0, 8).map(booking => (
                      <div key={booking.id} className="flex items-start gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-black text-[#0E1A2B] leading-tight truncate">
                            {booking.passHolderName}
                          </div>
                          <div className="text-[9px] font-medium text-slate-500 mt-0.5">
                            {booking.templeId.charAt(0).toUpperCase() + booking.templeId.slice(1)} · {booking.time} · {booking.devoteeCount} devotee{booking.devoteeCount > 1 ? 's' : ''}
                          </div>
                          <div className="text-[8px] text-slate-400 font-mono">{booking.bookingRef}</div>
                        </div>
                        <div className="text-[8px] text-slate-400 shrink-0">
                          {new Date(booking.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                    {bridge.mobileBookings.length > 8 && (
                      <div className="text-[9px] text-blue-500 font-bold text-center pt-1">
                        +{bridge.mobileBookings.length - 8} more mobile bookings
                      </div>
                    )}
                  </div>
                )}

                {bridge.lastSynced && (
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-100">
                    <RefreshCw className="w-2.5 h-2.5 text-slate-300" />
                    <span className="text-[8px] text-slate-400">
                      Last synced {bridge.lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {bridge.totalMobileBookings > 0 && (
                      <span className="ml-auto text-[8px] font-bold text-blue-600">
                        {bridge.totalMobileBookings} total mobile
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* LIVE SUMMARY MINI */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Cancellations</div>
    
                <div className="text-[14px] font-black text-red-500">142</div>
              </div>

  
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
    
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Overbooked
    
                </div>
    
                <div className="text-[14px] font-black text-orange-500">
      
                  4 Slots
    
                </div>
  
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
    
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Est. Revenue
    
                </div>
    
                <div className="text-[14px] font-black text-emerald-600 flex items-center gap-1">
      
                  <ArrowUpRight className="w-3 h-3" />
                  +12%
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
    
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  AI Health
                </div>
    
                <div className="text-[14px] font-black text-[#0E1A2B]">
                  Online
                </div>
              </div>
            </div>
  );
}
