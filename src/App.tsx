import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import Customers from './pages/Customers';
import Experiments from './pages/Experiments';
import Pipeline from './pages/Pipeline';
import Monitoring from './pages/Monitoring';

type Page = 'dashboard' | 'predict' | 'customers' | 'experiments' | 'pipeline' | 'monitoring';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'predict':
        return <Predict />;
      case 'customers':
        return <Customers />;
      case 'experiments':
        return <Experiments />;
      case 'pipeline':
        return <Pipeline />;
      case 'monitoring':
        return <Monitoring />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
