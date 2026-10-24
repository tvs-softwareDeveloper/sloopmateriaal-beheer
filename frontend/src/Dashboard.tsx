import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, CheckCircle,
  Package, ArrowRight, Clock, 
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useLanguage } from '@/components/LanguageContext';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import type { Material } from '../src/types';
import { API } from '../src/components/config';

export default function Dashboard() {
  const { t, language } = useLanguage();
  
const { data: materials = [], isLoading } = useQuery<Material[]>({
  queryKey: ['materials'],
  queryFn: async () => {
    const res = await fetch(`${API}/materials`);
    if (!res.ok) throw new Error('Failed to fetch materials');
    return res.json(); // moet een array van Material teruggeven
  },
});


  const recentMaterials = materials.slice(0, 5);
  
  const urgentItems = materials.filter(m => 
    m.status === 'for_disposal' || m.condition === 'poor'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-sn bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t('dashboardTitle')}</h1>
            <p className="text-slate-500 mt-1">{t('dashboardSubtitle')}</p>
          </div>
          <Link to={createPageUrl('Materials')}>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Package className="w-4 h-4 mr-2" />
              {t('viewAllMaterials')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <DashboardStats materials={materials} t={t} />

        {/* Charts */}
        <DashboardCharts materials={materials} t={t} />

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Materials */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                {t('recentlyAdded')}
              </CardTitle>
              <Link to={createPageUrl('Materials')}>
                <Button variant="ghost" size="sm">
                  {t('viewAll')}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {recentMaterials.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t('noMaterialsYet')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMaterials.map(material => (
                    <div 
                      key={material.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{material.name}</p>
                        <p className="text-sm text-slate-500">
                          {material.quantity} {t(`unit_${material.unit || 'pieces'}`)} • {t(material.material_type)}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          material.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                          material.status === 'for_sale' ? 'bg-blue-100 text-blue-700' :
                          material.status === 'sold' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {t(material.status)}
                        </span>
                        {material.created_date && (
                          <p className="text-slate-400 mt-1 text-xs">
                            {language === 'nl'
                              ? format(new Date(material.created_date), 'd MMM', { locale: nl })
                              : format(new Date(material.created_date), 'MMM d')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attention Required */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                {t('attentionRequired')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {urgentItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
                  <p>{t('allItemsGood')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentItems.slice(0, 5).map(material => (
                    <div 
                      key={material.id}
                      className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{material.name}</p>
                        <p className="text-sm text-slate-500">
                          {material.condition === 'poor' ? t('poorCondition') : t('pendingDisposal')}
                        </p>
                      </div>
                      <Link to={createPageUrl('Materials')}>
                        <Button variant="outline" size="sm">
                          {t('review')}
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {urgentItems.length > 5 && (
                    <p className="text-sm text-slate-500 text-center">
                      +{urgentItems.length - 5} {t('moreItems')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}