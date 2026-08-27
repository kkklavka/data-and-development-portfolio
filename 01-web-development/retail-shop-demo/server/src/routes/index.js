import { Router } from 'express'
import authRouter from './authRouter.js'
import userRouter from './userRouter.js'
import adminRouter from './adminRouter.js'

const router = Router()

router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/admin', adminRouter)

export default router
