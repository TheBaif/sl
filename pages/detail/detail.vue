<template>
  <view class="detail-container">
    <scroll-view scroll-y class="detail-scroll">
      <view class="detail-item">
        <view class="header">
          <text class="title">{{searchResult.name}}</text>
          <text class="pinyin">{{searchResult.pinyin}}</text>
        </view>
        
        <view class="content">
          <view class="gesture-section">
            <text class="section-title">手势说明：</text>
            <view class="gesture-steps">
              <text 
                v-for="(step, index) in gestureSteps" 
                :key="index" 
                class="step"
              >{{step}}</text>
            </view>
          </view>
          
          <view class="media-content">
            <image 
              v-if="searchResult.imageSrc" 
              :src="searchResult.imageSrc" 
              mode="aspectFit" 
              class="sign-image"
              @tap="previewImage(searchResult.imageSrc)"
            ></image>
            
            <video 
              v-if="searchResult.wordVideoSrc" 
              :src="searchResult.wordVideoSrc"
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
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      searchResult: {}
    }
  },
  
  computed: {
    gestureSteps() {
      if (!this.searchResult.gesture) return []
      return this.searchResult.gesture.split('|||').map(step => step.trim())
    }
  },
  
  onLoad(options) {
    const results = uni.getStorageSync('searchResults')
    if (results && options.index) {
      this.searchResult = results[parseInt(options.index)]
    }
  },
  
  methods: {
    previewImage(url) {
      uni.previewImage({
        urls: [url],
        current: url
      })
    }
  }
}
</script>

<style lang="scss">
.detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  
  .detail-scroll {
    height: 100vh;
  }
  
  .detail-item {
    background-color: #fff;
    padding: 30rpx;
    
    .header {
      border-bottom: 1px solid #eee;
      padding-bottom: 20rpx;
      margin-bottom: 30rpx;
      
      .title {
        font-size: 40rpx;
        color: #333;
        font-weight: bold;
        display: block;
        margin-bottom: 15rpx;
      }
      
      .pinyin {
        font-size: 32rpx;
        color: #666;
        display: block;
      }
    }
    
    .content {
      .gesture-section {
        margin-bottom: 30rpx;
        
        .section-title {
          font-size: 32rpx;
          color: #333;
          font-weight: bold;
          margin-bottom: 15rpx;
          display: block;
        }
        
        .gesture-steps {
          .step {
            font-size: 30rpx;
            color: #333;
            line-height: 1.6;
            padding: 10rpx 0;
            display: block;
            
            &:not(:last-child) {
              border-bottom: 1px dashed #eee;
            }
          }
        }
      }
      
      .media-content {
        .sign-image {
          width: 100%;
          height: 500rpx;
          margin-bottom: 30rpx;
          border-radius: 10rpx;
        }
        
        .sign-video {
          width: 100%;
          height: 500rpx;
          margin-bottom: 30rpx;
          border-radius: 10rpx;
        }
      }
    }
  }
}
</style>
