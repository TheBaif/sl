<template>
  <view class="user-container">
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else class="user-card">
      <view class="avatar-section">
        <image 
          :src="userInfo.userPic || '/static/avatar.png'" 
          mode="aspectFill" 
          class="avatar"
          @tap="showEditAvatar"
        ></image>
        <view class="camera-icon">
          <uni-icons type="camera-filled" size="24" color="#fff"></uni-icons>
        </view>
      </view>
      
      <view class="info-section">
        <view class="info-item">
          <text class="label">用户名</text>
          <view class="value-container">
            <text class="value">{{ userInfo.username || '未设置' }}</text>
          </view>
        </view>
        
        <view class="info-item">
          <text class="label">昵称</text>
          <view class="value-container">
            <text class="value">{{ userInfo.nickname || '未设置' }}</text>
            <uni-icons type="right" size="18" color="#999" @click="showEditNickname"></uni-icons>
          </view>
        </view>
        
        <view class="info-item">
          <text class="label">邮箱</text>
          <view class="value-container">
            <text class="value">{{ userInfo.email || '未设置' }}</text>
            <uni-icons type="right" size="18" color="#999" @click="showEditEmail"></uni-icons>
          </view>
        </view>
      </view>
      
      <view class="action-buttons">
        <button class="logout-btn" @tap="handleLogout">退出登录</button>
      </view>
    </view>
    
    <!-- 编辑头像弹窗 -->
    <uni-popup ref="avatarPopup" type="bottom">
      <view class="popup-content">
        <view class="popup-title">修改头像</view>
        <view class="popup-options">
          <view class="popup-option" @tap="chooseImage('album')">从相册选择</view>
          <view class="popup-option" @tap="chooseImage('camera')">拍照</view>
        </view>
        <view class="popup-cancel" @tap="closePopup">取消</view>
      </view>
    </uni-popup>
    
    <!-- 编辑昵称弹窗 -->
    <uni-popup ref="nicknamePopup" type="dialog">
      <uni-popup-dialog
        title="修改昵称"
        mode="input"
        :value="editForm.nickname"
        placeholder="请输入昵称"
        @confirm="handleUpdateNickname"
      ></uni-popup-dialog>
    </uni-popup>
    
    <!-- 编辑邮箱弹窗 -->
    <uni-popup ref="emailPopup" type="dialog">
      <uni-popup-dialog
        title="修改邮箱"
        mode="input"
        :value="editForm.email"
        placeholder="请输入邮箱"
        @confirm="handleUpdateEmail"
      ></uni-popup-dialog>
    </uni-popup>
	
	<view class="info-section">
		<view class="info-item">
		    <text class="label">学习进度</text>
		    <view class="value-container">
		      <text class="value">查看详情</text>
		      <uni-icons type="right" size="18" color="#999" @click="navigateToProgressDashboard"></uni-icons>
		    </view>
		</view>
		</view>
  </view>
</template>

<script>
import http from '@/utils/request.js'

export default {
  data() {
    return {
      userInfo: {
        id: '',
        username: '',
        nickname: '',
        email: '',
        userPic: '',
        createTime: '',
        updateTime: ''
      },
      loading: true,
      editForm: {
        nickname: '',
        email: ''
      }
    }
  },
  
  onShow() {
    this.getUserInfo()
  },
  
  methods: {
    async getUserInfo() {
      try {
        this.loading = true
        
        // 使用http工具或者直接使用uni.request
        let res
        try {
          res = await http.get('/user/userInfo')
        } catch (err) {
          // 如果http工具出错，尝试直接使用uni.request
          res = await this.requestGet('/user/userInfo')
        }
        
        // 添加日志查看实际返回数据结构
        console.log('获取到的用户信息:', res)
        
        // 根据返回结构正确获取数据
        if (res.data && res.data.code === 0) {
          // 如果是uni.request封装的结果，通常是res.data包含API返回值
          this.userInfo = res.data.data
          this.editForm.nickname = this.userInfo.nickname
          this.editForm.email = this.userInfo.email
        } else if (res.code === 0) {
          // 如果是直接返回API结果
          this.userInfo = res.data
          this.editForm.nickname = this.userInfo.nickname
          this.editForm.email = this.userInfo.email
        } else {
          const message = (res.data && res.data.message) || res.message || '获取用户信息失败'
          uni.showToast({
            title: message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
        
        // 可能是未登录或token过期
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }, 1500)
      } finally {
        this.loading = false
      }
    },
	navigateToProgressDashboard() {
	  uni.navigateTo({
	    url: '/pages/progress-dashboard/progress-dashboard'
	  })
	},
    
    // 通用GET请求方法
    requestGet(url) {
      return new Promise((resolve, reject) => {
        uni.request({
          url: `http://localhost:8080${url}`,
          method: 'GET',
          header: {
            'Content-Type': 'application/json',
            'Authorization': uni.getStorageSync('token')
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res)
            } else {
              reject(new Error(`请求失败，状态码: ${res.statusCode}`))
            }
          },
          fail: (err) => {
            reject(err)
          }
        })
      })
    },
    
    // 弹窗相关方法
    showEditAvatar() {
      this.$refs.avatarPopup.open()
    },
    
    showEditNickname() {
      this.$refs.nicknamePopup.open()
    },
    
    showEditEmail() {
      this.$refs.emailPopup.open()
    },
    
    closePopup() {
      this.$refs.avatarPopup.close()
      this.$refs.nicknamePopup.close()
      this.$refs.emailPopup.close()
    },
    
    // 选择并上传图片
    chooseImage(sourceType) {
      uni.chooseImage({
        count: 1,
        sourceType: [sourceType],
        success: (res) => {
          const tempFilePaths = res.tempFilePaths
          // 选择图片后直接上传到临时服务器
          this.uploadAndUpdateAvatar(tempFilePaths[0])
          this.$refs.avatarPopup.close()
        }
      })
    },
    
    // 上传图片并更新头像
    async uploadAndUpdateAvatar(filePath) {
      uni.showLoading({
        title: '上传中...'
      })
      
      try {
        // 步骤1: 上传图片到服务器获取URL
        const imageUrl = await this.uploadImageToServer(filePath)
        
        // 步骤2: 使用获取到的URL更新用户头像
        await this.updateAvatarUrl(imageUrl)
        
        uni.showToast({
          title: '头像更新成功',
          icon: 'success'
        })
        
        // 更新头像后刷新用户信息
        this.getUserInfo()
      } catch (error) {
        console.error('上传头像失败:', error)
        uni.showToast({
          title: error.message || '上传头像失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 上传图片到服务器
    uploadImageToServer(filePath) {
      return new Promise((resolve, reject) => {
        // 这里需要替换为你的图片上传服务
        // 示例使用模拟上传，实际项目请更换为真实的上传逻辑
        
        // 模拟方案：直接返回一个URL（开发或测试时使用）
        setTimeout(() => {
          const mockUrl = "https://example.com/images/avatar.jpg"
          resolve(mockUrl)
        }, 1000)
        
        /* 
        // 真实上传示例 - 请根据你的实际情况修改
        uni.uploadFile({
          url: 'https://your-upload-service.com/upload',
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': uni.getStorageSync('token')
          },
          success: (uploadRes) => {
            console.log('文件上传响应:', uploadRes)
            if (uploadRes.statusCode === 200) {
              try {
                const data = JSON.parse(uploadRes.data)
                // 假设服务器返回 {url: "https://..."}
                resolve(data.url)
              } catch (e) {
                reject(new Error('解析响应失败'))
              }
            } else {
              reject(new Error('上传失败'))
            }
          },
          fail: (err) => {
            reject(new Error('上传请求失败'))
          }
        })
        */
      })
    },
    
    // 更新头像URL - 使用PATCH请求
    updateAvatarUrl(avatarUrl) {
      return new Promise((resolve, reject) => {
        uni.request({
          url: `http://localhost:8080/user/updateAvatar?avatarUrl=${encodeURIComponent(avatarUrl)}`,
          method: 'PATCH',
          header: {
            'Content-Type': 'application/json',
            'Authorization': uni.getStorageSync('token')
          },
          success: (res) => {
            console.log('更新头像响应:', res)
            if (res.statusCode === 200) {
              let data = res.data
              if (data.code === 0) {
                resolve(true)
              } else {
                reject(new Error(data.message || '更新头像失败'))
              }
            } else {
              reject(new Error(`请求失败，状态码: ${res.statusCode}`))
            }
          },
          fail: (err) => {
            console.error('更新头像请求失败:', err)
            reject(new Error('请求失败'))
          }
        })
      })
    },
    
    // 更新昵称
    async handleUpdateNickname(value) {
      const updateData = {
        id: this.userInfo.id,
        nickname: value,
        email: this.userInfo.email
      }
      await this.updateUserInfo(updateData, '昵称')
    },
    
    // 更新邮箱
    async handleUpdateEmail(value) {
      // 简单的邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (value && !emailRegex.test(value)) {
        uni.showToast({
          title: '邮箱格式不正确',
          icon: 'none'
        })
        return
      }
      
      const updateData = {
        id: this.userInfo.id,
        nickname: this.userInfo.nickname,
        email: value
      }
      await this.updateUserInfo(updateData, '邮箱')
    },
    
    // 统一处理更新用户信息的方法 - 使用PUT方法和/update接口
    async updateUserInfo(data, fieldName) {
      try {
        uni.showLoading({
          title: '更新中...'
        })
        
        // 使用uni.request直接发送PUT请求
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: 'http://localhost:8080/user/update',
            method: 'PUT',
            data: data,
            header: {
              'Content-Type': 'application/json',
              'Authorization': uni.getStorageSync('token')
            },
            success: (res) => {
              console.log('更新用户信息响应:', res)
              if (res.statusCode === 200) {
                resolve(res)
              } else {
                reject(new Error(`请求失败，状态码: ${res.statusCode}`))
              }
            },
            fail: (err) => {
              console.error('更新用户信息请求失败:', err)
              reject(new Error('请求失败'))
            }
          })
        })
        
        // 处理响应结果
        const res = result
        
        if ((res.data && res.data.code === 0) || res.code === 0) {
          uni.showToast({
            title: `${fieldName}更新成功`,
            icon: 'success'
          })
          this.getUserInfo() // 刷新用户信息
        } else {
          const message = (res.data && res.data.message) || res.message || '更新失败'
          throw new Error(message)
        }
      } catch (error) {
        console.error('更新用户信息失败:', error)
        uni.showToast({
          title: error.message || '更新失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 退出登录
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('token')
            
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            })
            
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/login/login'
              })
            }, 1500)
          }
        }
      })
    }
  }
}
</script>

<style lang="scss">
.user-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
  
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300rpx;
    color: #999;
    font-size: 28rpx;
  }
  
  .user-card {
    background-color: #fff;
    border-radius: 15rpx;
    padding: 40rpx 30rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .avatar-section {
      display: flex;
      justify-content: center;
      margin-bottom: 40rpx;
      position: relative;
      
      .avatar {
        width: 180rpx;
        height: 180rpx;
        border-radius: 50%;
        border: 4rpx solid #f0f0f0;
      }
      
      .camera-icon {
        position: absolute;
        bottom: 0;
        right: 50%;
        transform: translateX(60rpx);
        width: 50rpx;
        height: 50rpx;
        background-color: rgba(0, 122, 255, 0.8);
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
    
    .info-section {
      margin-bottom: 50rpx;
      
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 1px solid #f5f5f5;
        
        .label {
          color: #999;
          font-size: 28rpx;
        }
        
        .value-container {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          
          .value {
            color: #333;
            font-size: 28rpx;
            margin-right: 10rpx;
          }
        }
      }
    }
    
    .action-buttons {
      margin-top: 50rpx;
      
      .logout-btn {
        background-color: #FF3B30;
        color: #fff;
        height: 80rpx;
        line-height: 80rpx;
        border-radius: 40rpx;
        font-size: 28rpx;
      }
    }
  }
  
  .popup-content {
    background-color: #fff;
    border-top-left-radius: 20rpx;
    border-top-right-radius: 20rpx;
    overflow: hidden;
    
    .popup-title {
      text-align: center;
      font-size: 32rpx;
      color: #333;
      padding: 30rpx 0;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .popup-options {
      .popup-option {
        padding: 30rpx 0;
        text-align: center;
        font-size: 30rpx;
        color: #333;
        border-bottom: 1px solid #f5f5f5;
        
        &:active {
          background-color: #f5f5f5;
        }
      }
    }
    
    .popup-cancel {
      padding: 30rpx 0;
      text-align: center;
      font-size: 30rpx;
      color: #999;
      margin-top: 20rpx;
      
      &:active {
        background-color: #f5f5f5;
      }
    }
  }
}
</style>
