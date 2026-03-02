'use client'

export default function BuyNowButton() {
  const handleClick = () => {
    console.log('handleClick')
    window.dataLayer?.push({
      event: 'custom_button_click',
      button_name: 'buy_now_header',
      button_location: 'header',
      value: 99.99,
    })
  }

  return (
    <button onClick={handleClick} className="rounded bg-blue-500 p-2 text-white">
      立即购买
    </button>
  )
}
