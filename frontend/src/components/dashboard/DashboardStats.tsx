import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, DollarSign, Recycle, Trash2, 
  TrendingUp, ShoppingCart, Archive
} from 'lucide-react';
import type { Material } from '@/types';

interface DashboardStatsProps {
  materials: Material[];
  t: (key: string) => string;
}

export default function DashboardStats({ materials, t } : DashboardStatsProps)  {
  const stats = React.useMemo(() => {
    const total = materials.length;
    const forSale = materials.filter(m => m.status === 'for_sale').length;
    const forReuse = materials.filter(m => m.status === 'for_reuse').length;
    const forDisposal = materials.filter(m => m.status === 'for_disposal').length;
    const sold = materials.filter(m => m.status === 'sold').length;
    const available = materials.filter(m => m.status === 'available').length;
const totalValue = materials
  .filter(m => m.price !== undefined && m.price > 0)
  .reduce((sum, m) => sum + (m.price! * m.quantity), 0);

const soldValue = materials
  .filter(m => m.status === 'sold' && m.price !== undefined && m.price > 0)
  .reduce((sum, m) => sum + (m.price! * m.quantity), 0);


    return { total, forSale, forReuse, forDisposal, sold, available, totalValue, soldValue };
  }, [materials]);

  const statCards = [
    {
      label: t('totalMaterials'),
      value: stats.total,
      icon: Package,
      color: 'bg-slate-100 text-slate-600',
      iconBg: 'bg-slate-200'
    },
    {
      label: t('available'),
      value: stats.available,
      icon: Archive,
      color: 'bg-emerald-50 text-emerald-700',
      iconBg: 'bg-emerald-100'
    },
    {
      label: t('forSale'),
      value: stats.forSale,
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-700',
      iconBg: 'bg-blue-100'
    },
    {
      label: t('forReuse'),
      value: stats.forReuse,
      icon: Recycle,
      color: 'bg-violet-50 text-violet-700',
      iconBg: 'bg-violet-100'
    },
    {
      label: t('forDisposal'),
      value: stats.forDisposal,
      icon: Trash2,
      color: 'bg-slate-50 text-slate-600',
      iconBg: 'bg-slate-200'
    },
    {
      label: t('sold'),
      value: stats.sold,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-700',
      iconBg: 'bg-green-100'
    },
    {
      label: t('inventoryValue'),
      value: `${t('currencySymbol')}${stats.totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-amber-50 text-amber-700',
      iconBg: 'bg-amber-100'
    },
    {
      label: t('revenueSold'),
      value: `${t('currencySymbol')}${stats.soldValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-50 text-green-700',
      iconBg: 'bg-green-100'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={`${stat.color} border-0 shadow-sm`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-70 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                <stat.icon className="w-5 h-5 opacity-70" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}