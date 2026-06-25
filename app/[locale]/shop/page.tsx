import { Suspense } from 'react';
import Component from '@/components/pages/CategoryPage';
import GetAllPages from '@/components/pages/GetAllPages';
import GetAllMenus from '@/components/cms/menus/GetAllMenus';
import GetProductCategoryWise from '@/lib/GetAllDetails/GetProductCategoryWise';
import PageLoader from '@/components/pages/PageLoader';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader text="Loading Shop" />}>
      <GetAllPages />
      <GetAllMenus />
      <GetProductCategoryWise />
      <Component />
    </Suspense>
  );
}
