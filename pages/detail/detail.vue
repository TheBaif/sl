<template>
  <view class="detail-container">
    <!-- Header with Navigation -->
    <view class="detail-header">
      <view class="header-left">
        <view class="back-button" @tap="navigateBack">
          <text class="iconfont">&#xe679;</text>
        </view>
        <text class="header-title">手语详情</text>
      </view>
      <view class="header-right">
        <view class="like-button" @tap="toggleFavorite">
          <text class="iconfont" :class="{'liked': isFavorite}">&#xe66b;</text>
        </view>
      </view>
    </view>
    
    <!-- Content Area -->
    <scroll-view scroll-y class="detail-content" enable-back-to-top>
      <!-- Title Section -->
      <view class="title-section">
        <view class="title-content">
          <text class="title">{{ signData.name || '未知手语' }}</text>
          <text class="pinyin">{{ signData.pinyin || '无拼音' }}</text>
        </view>
        
        <view class="difficulty-tag" v-if="signData.difficulty">
          <text class="tag-text">{{ getDifficultyText(signData.difficulty) }}</text>
        </view>
      </view>
      
      <!-- Media Section -->
      <view class="media-section">
        <view class="media-tabs">
          <view 
            class="tab-item" 
            :class="{'active': activeTab === 'image'}"
            @tap="activeTab = 'image'"
          >
            <text class="iconfont">&#xe65d;</text>
            <text class="tab-text">手语图</text>
          </view>
          <view 
            class="tab-item" 
            :class="{'active': activeTab === 'video'}"
            @tap="activeTab = 'video'"
            v-if="signData.wordVideoSrc"
          >
            <text class="iconfont">&#xe666;</text>
            <text class="tab-text">教学视频</text>
          </view>
        </view>
        
        <view class="media-content">
          <view v-if="activeTab === 'image'">
            <image 
              :src="signData.imageSrc || '/static/placeholder-sign.png'" 
              mode="aspectFit" 
              class="sign-image"
              @tap="previewImage(signData.imageSrc)"
            ></image>
          </view>
          
          <view v-else-if="activeTab === 'video' && signData.wordVideoSrc">
            <video 
              :src="signData.wordVideoSrc"
              class="sign-video"
              :controls="true"
              :show-play-btn="true"
              :enable-play-gesture="true"
              :show-fullscreen-btn="true"
              :object-fit="'cover'"
              :initial-time="0"
            ></video>
          </view>
        </view>
      </view>
      
      <!-- Gesture Instructions -->
      <view class="gesture-section">
        <view class="section-header">
          <text class="section-title">手势说明</text>
        </view>
        
        <view class="gesture-steps">
          <view 
            class="step-item"
            v-for="(step, index) in gestureSteps" 
            :key="index" 
          >
            <view class="step-number">{{ index + 1 }}</view>
            <text class="step-text">{{ step }}</text>
          </view>
          
          <view class="empty-steps" v-if="!gestureSteps.length">
            <text>暂无手势说明</text>
          </view>
        </view>
      </view>
      
      
    </scroll-view>
    
    <!-- Bottom Actions Bar -->
    <view class="bottom-actions">
      <button class="practice-btn" @tap="startPractice">
        <text class="iconfont">&#xe665;</text>
        <text>练习此手语</text>
      </button>
    </view>
  </view>
</template>

<script>
import http from '@/utils/request.js'
import detailHelper from '@/utils/detailHelper.js'
export default {
  data() {
    return {
      signData: {},
      activeTab: 'image',
      isFavorite: false,
      relatedSigns: [],
	   searchResult: {},
	        loading: true,
	        errorInfo: {
	          image: false,
	          video: false
	        },
			}
  },
  
  computed: {
    gestureSteps() {
      if (!this.signData.gesture) return []
      return this.signData.gesture.split('|||').map(step => step.trim())
    }
  },
  
  onLoad(options) {
   try {
         const results = uni.getStorageSync('searchResults');
         if (results && options.index) {
           const index = parseInt(options.index);
           if (results[index]) {
             this.searchResult = results[index];
           } else {
             throw new Error('数据索引无效');
           }
         } else {
           throw new Error('未找到详情数据');
         }
       } catch (error) {
         console.error('加载详情失败:', error);
         uni.showToast({
           title: '加载详情失败',
           icon: 'none'
         });
       } finally {
         this.loading = false;
       }
  },
  
  methods: {
    navigateBack() {
      uni.navigateBack()
    },
    
    loadSignDetail(index) {
      const results = uni.getStorageSync('searchResults')
      if (results && index !== undefined) {
        this.signData = results[parseInt(index)]
        // Record this view for learning tracking
        this.recordLearningActivity()
      } else {
        uni.showToast({
          title: '加载详情失败',
          icon: 'none'
        })
      }
    },
    
    async recordLearningActivity() {
      if (!this.signData || !this.signData.id) return
      
      try {
        await http.post('/learning/record', {
          signId: this.signData.id
        })
        console.log('学习记录已保存')
      } catch (error) {
        console.error('保存学习记录失败:', error)
      }
    },
	async recordDetailedView(signId) {
	  try {
	    const token = uni.getStorageSync('token');
	    if (!token) {
	      console.error('未登录，无法记录学习活动');
	      return;
	    }
	    
	    console.log(`记录详细学习: 手语ID ${signId}`);
	    
	    // This viewing is more intensive learning than just list view
	    // We can consider it more valuable by sending an extended viewing parameter
	    const res = await http.post('/learning/record', {
	      signId: signId,
	      // Using extended time parameter to indicate deeper learning
	      extendedView: true
	    }, {
	      header: {
	        'Authorization': token,
	        'Content-Type': 'application/x-www-form-urlencoded'
	      }
	    });
	    
	    if (res.statusCode === 200 && res.data.code === 0) {
	      console.log('详细学习记录已保存');
	    } else {
	      console.error('保存详细学习记录失败:', res.data.message);
	    }
	  } catch (error) {
	    console.error('记录详细学习活动失败:', error);
	  }
	},
    
    async getRelatedSigns() {
      // Mock related signs - in a real app, this would come from an API
      this.relatedSigns = [
        { id: 1, name: '你好', imageSrc: '/static/signs/hello.png' },
        { id: 2, name: '谢谢', imageSrc: '/static/signs/thanks.png' },
        { id: 3, name: '再见', imageSrc: '/static/signs/goodbye.png' },
        { id: 4, name: '朋友', imageSrc: '/static/signs/friend.png' }
      ]
    },
    
    previewImage(url) {
      if (!url) return
      
      uni.previewImage({
        urls: [url],
        current: url
      })
    },
    
    toggleFavorite() {
      this.isFavorite = !this.isFavorite
      uni.showToast({
        title: this.isFavorite ? '已添加到收藏' : '已取消收藏',
        icon: 'none'
      })
    },
    
    viewRelatedSign(sign) {
      const results = [sign]
      uni.setStorageSync('searchResults', results)
      uni.redirectTo({
        url: `/pages/detail/detail?index=0`
      })
    },
    
    startPractice() {
      uni.navigateTo({
        url: '/pages/practice/practice'
      })
    },
    
    getDifficultyText(difficulty) {
      const difficultyMap = {
        'BEGINNER': '初级',
        'INTERMEDIATE': '中级',
        'ADVANCED': '高级'
      }
      return difficultyMap[difficulty] || '未知'
    }
  }
}
</script>

<style lang="scss">
.detail-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f8f8;
  
  .detail-header {
    height: 100rpx;
    background-color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 30rpx;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .header-left {
      display: flex;
      align-items: center;
      
      .back-button {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .iconfont {
          font-size: 36rpx;
          color: #333;
        }
      }
      
      .header-title {
        font-size: 34rpx;
        font-weight: bold;
        color: #333;
        margin-left: 20rpx;
      }
    }
    
    .header-right {
      .like-button {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .iconfont {
          font-size: 36rpx;
          color: #999;
          
          &.liked {
            color: #ff6b6b;
          }
        }
      }
    }
  }
  
  .detail-content {
    flex: 1;
    padding-bottom: 120rpx; // Space for bottom actions
    
    .title-section {
      background-color: #fff;
      padding: 30rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f0f0f0;
      
      .title-content {
        .title {
          font-size: 40rpx;
          color: #333;
          font-weight: bold;
          margin-bottom: 10rpx;
          display: block;
        }
        
        .pinyin {
          font-size: 28rpx;
          color: #999;
        }
      }
      
      .difficulty-tag {
        background-color: rgba(60, 137, 153, 0.1);
        padding: 8rpx 20rpx;
        border-radius: 30rpx;
        
        .tag-text {
          font-size: 24rpx;
          color: #3C8999;
        }
      }
    }
    
    .media-section {
      background-color: #fff;
      padding: 20rpx 30rpx 40rpx;
      
      .media-tabs {
        display: flex;
        border-bottom: 1px solid #f0f0f0;
        margin-bottom: 30rpx;
        
        .tab-item {
          display: flex;
          align-items: center;
          padding: 20rpx 30rpx;
          margin-right: 30rpx;
          position: relative;
          
          .iconfont {
            font-size: 32rpx;
            color: #999;
            margin-right: 10rpx;
          }
          
          .tab-text {
            font-size: 28rpx;
            color: #999;
          }
          
          &.active {
            .iconfont, .tab-text {
              color: #3C8999;
              font-weight: bold;
            }
            
            &:after {
              content: '';
              position: absolute;
              bottom: -1rpx;
              left: 0;
              right: 0;
              height: 4rpx;
              background-color: #3C8999;
              border-radius: 2rpx;
            }
          }
        }
      }
      
      .media-content {
        .sign-image {
          width: 100%;
          height: 500rpx;
          border-radius: 10rpx;
          background-color: #f5f5f5;
        }
        
        .sign-video {
          width: 100%;
          height: 500rpx;
          border-radius: 10rpx;
        }
      }
    }
    
    .gesture-section {
      background-color: #fff;
      padding: 30rpx;
      margin-top: 20rpx;
      
      .section-header {
        margin-bottom: 30rpx;
        
        .section-title {
          font-size: 32rpx;
          color: #333;
          font-weight: bold;
        }
      }
      
      .gesture-steps {
        .step-item {
          display: flex;
          margin-bottom: 20rpx;
          
          .step-number {
            width: 50rpx;
            height: 50rpx;
            background-color: #3C8999;
            color: #fff;
            border-radius: 25rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26rpx;
            margin-right: 20rpx;
            flex-shrink: 0;
          }
          
          .step-text {
            font-size: 28rpx;
            color: #333;
            line-height: 1.6;
            padding-top: 10rpx;
          }
        }
        
        .empty-steps {
          padding: 40rpx 0;
          text-align: center;
          color: #999;
          font-size: 28rpx;
        }
      }
    }
    
    .related-section {
      background-color: #fff;
      padding: 30rpx;
      margin-top: 20rpx;
      
      .section-header {
        margin-bottom: 30rpx;
        
        .section-title {
          font-size: 32rpx;
          color: #333;
          font-weight: bold;
        }
      }
      
      .related-scrollview {
        white-space: nowrap;
        
        .related-item {
          display: inline-block;
          width: 200rpx;
          margin-right: 20rpx;
          
          .related-image {
            width: 200rpx;
            height: 200rpx;
            border-radius: 10rpx;
            background-color: #f5f5f5;
            margin-bottom: 10rpx;
          }
          
          .related-name {
            font-size: 26rpx;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
          }
        }
      }
    }
  }
  
  .bottom-actions {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #fff;
    padding: 20rpx 30rpx;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .practice-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(to right, #3C8999, #55a5b5);
      height: 90rpx;
      border-radius: 45rpx;
      color: #fff;
      font-size: 32rpx;
      
      .iconfont {
        font-size: 36rpx;
        margin-right: 10rpx;
      }
      
      &::after {
        border: none;
      }
    }
  }
}
</style>