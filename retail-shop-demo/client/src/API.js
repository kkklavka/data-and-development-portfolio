import axios from 'axios'

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3500'}/api`

class APIRequest {
  constructor () {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    })

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })
  }

  getPrefix () {
    try {
      const accessLevel = JSON.parse(localStorage.getItem('user'))?.access_level || 1
      return accessLevel >= 2 ? '/admin' : '/user'
    } catch {
      return '/user'
    }
  }

  request (url, method = 'GET', data = undefined) {
    return this.client({ url, method, data }).then((response) => response.data)
  }

  login (data) { return this.request('/auth/login', 'POST', data) }
  register (data) { return this.request('/auth/register', 'POST', data) }
  getProfile () { return this.request('/auth/profile') }
  logout () { return this.request('/auth/logout', 'POST') }

  getAllProducts () { return this.request(`${this.getPrefix()}/products`) }
  getProductById (id) { return this.request(`${this.getPrefix()}/products/${id}`) }

  getCart () { return this.request(`${this.getPrefix()}/cart`) }
  addToCart (data) { return this.request(`${this.getPrefix()}/cart`, 'POST', data) }
  updateCartQuantity (data) { return this.request(`${this.getPrefix()}/cart`, 'PUT', data) }
  removeFromCart (productId) { return this.request(`${this.getPrefix()}/cart/${productId}`, 'DELETE') }
  clearCart () { return this.request(`${this.getPrefix()}/cart`, 'DELETE') }

  getBonusCard () { return this.request('/user/bonus') }
  createBonusCard (data) { return this.request('/user/bonus', 'POST', data) }
  getBonusCardByNumber (cardNumber) { return this.request(`/admin/bonus/${encodeURIComponent(cardNumber)}`) }

  pay (data) { return this.request(`${this.getPrefix()}/pay`, 'POST', data) }

  getMyReceipts () {
    return this.request('/user/receipts').then((data) => data?.receipts || [])
  }

  getReceiptById (id) {
    const prefix = this.getPrefix()
    const path = prefix === '/admin' ? `/admin/receipts/${id}` : `/user/receipt/${id}`
    return this.request(path)
  }

  createOrder (data) { return this.request('/user/orders', 'POST', data) }
  getUserOrders () { return this.request('/user/orders') }
  getAdminOrders () { return this.request('/admin/orders') }
  updateOrderStatus (id, status) { return this.request(`/admin/orders/${id}`, 'PUT', { status }) }

  getMessages () { return this.request(`${this.getPrefix()}/messages`) }
  sendMessage (data) { return this.request(`${this.getPrefix()}/messages`, 'POST', data) }
  getAllUsers () { return this.request('/admin/users') }
}

export default new APIRequest()
