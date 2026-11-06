import type {Metadata} from 'next';
import './globals.css';
import './game.css';
export const metadata:Metadata={title:'BoomGrid',description:"Hide 3 numbers. Hunt everyone else's. A real-time arcade showdown for 2 to 6 players.",openGraph:{title:'BoomGrid',description:'Hide 3 numbers. Hunt everyone else’s. Last one alive wins.',images:['/boomgrid-cover.png']},icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
