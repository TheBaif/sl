<template>
  <view class="detail-container">
    <!-- 加载中状态 -->
    <view v-if="loading" class="loading-state">
      <view class="loader"></view>
      <text>加载中，请稍候...</text>
    </view>
    
    <!-- 错误状态 -->
    <view v-else-if="error" class="error-state">
      <text class="error-message">{{ errorMessage }}</text>
      <button class="retry-button" @tap="fetchSignDetail">重试</button>
    </view>
    
    <!-- 内容显示 -->
    <view v-else class="detail-content">
      <view class="header">
        <text class="title">{{ searchResult.name }}</text>
        <text class="pinyin">{{ searchResult.pinyin }}</text>
      </view>
      
      <view class="content">
        <!-- 手势说明部分 -->
        <view class="gesture-section">
          <text class="section-title">手势说明：</text>
          <view class="gesture-steps">
            <text v-for="(step, index) in gestureSteps" 
                 :key="index" 
                 class="step">{{ step }}</text>
          </view>
        </view>
        
        <!-- 媒体内容部分 -->
        <view class="media-content">
          <image v-if="searchResult.imageSrc" 
                 :src="searchResult.imageSrc" 
                 mode="aspectFit" 
                 class="sign-image"
                 @tap="previewImage(searchResult.imageSrc)"
                 @error="handleImageError"></image>
          
          <video v-if="searchResult.wordVideoSrc" 
                 :src="searchResult.wordVideoSrc"
                 class="sign-video"
                 :controls="true"
                 :show-play-btn="true"
                 :enable-play-gesture="true"
                 :show-fullscreen-btn="true"
                 :object-fit="'cover'"
                 :initial-time="0"></video>
        </view>
      </view>
    </view>
  </view>
</template>
<script>
import http from '@/utils/request.js'
import detailHelper from '@/utils/detailHelper.js'
export default {
  data() {
    return {
      signId: null,
            searchResult: {},
            loading: true,
            error: false,
            errorMessage: ''
  }
  },
  
  computed: {
      gestureSteps() {
        if (!this.searchResult.gesture) return [];
        return this.searchResult.gesture.split('|||').map(step => step.trim());
      }
    },
  
  onLoad(options) {
   if (options.id) {
         this.signId = options.id;
         this.fetchSignDetail();
       } else {
         this.error = true;
         this.errorMessage = '参数错误，未获取到手语ID';
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
	async fetchSignDetail() {
	      try {
	        this.loading = true;
	        
	        const res = await uni.request({
	          url: `http://localhost:8080/sign/detail/${this.signId}`,
	          method: 'GET',
	          header: {
	            'Authorization': uni.getStorageSync('token')
	          }
	        });
	        
	        if (res.statusCode === 200 && res.data.code === 0) {
	          this.searchResult = res.data.data;
	        } else {
	          throw new Error(res.data?.message || '获取详情失败');
	        }
	      } catch (error) {
	        console.error('获取手语详情失败:', error);
	        this.error = true;
	        this.errorMessage = error.message || '获取详情失败';
	      } finally {
	        this.loading = false;
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
	debugDetailData() {
	    console.group('详情页数据调试');
	    console.log('当前详情数据:', this.searchResult);
	    console.log('图片URL:', this.searchResult.imageSrc);
	    console.log('视频URL:', this.searchResult.wordVideoSrc);
	    console.log('手势说明:', this.gestureSteps);
	    console.log('错误信息:', this.errorInfo);
	    console.groupEnd();
	    
	    // 显示调试信息
	    uni.showModal({
	      title: '调试信息',
	      content: `ID: ${this.searchResult.id}\n`+
	               `图片: ${this.searchResult.imageSrc ? '有' : '无'}\n`+
	               `视频: ${this.searchResult.wordVideoSrc ? '有' : '无'}\n`+
	               `手势: ${this.gestureSteps && this.gestureSteps.length ? '有' : '无'}`,
	      showCancel: false
	    });
	  },
    
      
     previewImage(url) {
           if (!url) return;
           uni.previewImage({
             urls: [url],
             current: url
           });
         }
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