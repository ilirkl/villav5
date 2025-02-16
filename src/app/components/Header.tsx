import Link from 'next/link';

const Header = () => {
    return (
        <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center h-16 items-center">
                    <Link href="/" className="flex-shrink-0">
                         <img
                             src="/villa-e-gurit.svg"
                             alt="Villa E Gurit Logo"
                             className="h-20 w-auto"
                            />
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
