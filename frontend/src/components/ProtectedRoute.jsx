import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getStoredUser, getToken } from '../utils/auth';

function ProtectedRoute() {
  const location = useLocation();
  const token = getToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
