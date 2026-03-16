const Footer = () => {
    return (
        <div className='bg-slate-800 flex w-full flex-col items-center justify-center text-white'>
            <div className="logo font-bold text-2xl">
                <span className="text-green-700">&lt;</span>
                PASS
                <span className="text-green-700">OP&gt;</span>
            </div>
            <div className='flex justify-center items-center'>
                Created with <img className='w-5 h-5 mx-1' src="/icons/heart.png" alt="heart icon" /> by CodeWithHarry
            </div>
        </div>
    )
}

export default Footer
