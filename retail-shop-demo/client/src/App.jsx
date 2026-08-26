import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { useUser } from './context/UserContext'
import SignIn from './SignIn'
import SignUp from './SignUp'
import UserDashboard from './user/UserDashboard'
import UserOrders from './user/UserOrders'
import AdminDashboard from './dashboard/AdminDashboard'
import AdminOrders from './dashboard/AdminOrders'
import History from './dashboard/History'
import ReceiptView from './dashboard/ReceiptView'

function App () {
  const { user } = useUser()

  return (
    <>
      <Routes>
        <Route path="/signin" element={!user ? <SignIn /> : <Navigate to={user.access_level >= 2 ? '/admin' : '/user'} replace />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to={user.access_level >= 2 ? '/admin' : '/user'} replace />} />

        {user?.access_level === 1 && (
          <>
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/orders" element={<UserOrders />} />
            <Route path="/history" element={<History />} />
            <Route path="/receipt/:id" element={<ReceiptView />} />
            <Route path="*" element={<Navigate to="/user" replace />} />
          </>
        )}

        {user?.access_level >= 2 && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/receipt/:id" element={<ReceiptView />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        )}

        {!user && <Route path="*" element={<Navigate to="/signin" replace />} />}
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

export default App
