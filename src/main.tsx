import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from './App.tsx'
import Layout from './layout.tsx'
import DistrictPage from "./routes/district.tsx";
import Activity from "./routes/activity.tsx"
import Laws from "./routes/laws.tsx"
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout/>,
    children: [
      {
        path: "/",
        element: <App/>
      },
      {
        path: "/activity",
        element: <Activity/>
      },
      {
        path: "/laws",
        element: <Laws/>
      },
      {
        path: "/district/:address",
        element: <DistrictPage/>
      }
    ]
  },
  
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    
    <RouterProvider router={router} />
  </React.StrictMode>
);
