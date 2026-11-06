import type {ButtonHTMLAttributes,ReactNode} from 'react';
import {cn} from '@/lib/utils';
export function ArcadeButton({children,className,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{children:ReactNode}){return <button className={cn('arcade-button',className)} {...props}>{children}</button>}
