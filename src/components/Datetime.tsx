import { useMemo } from 'react';

import { LOCALE } from '@config';

interface DatetimesProps {
    pubDatetime: string | Date;
}

const FormattedDatetime = ({ pubDatetime }: DatetimesProps) => {
    const timeStr = pubDatetime;
    const myDatetime = new Date(timeStr);

    const dateStr = myDatetime.toLocaleDateString(LOCALE.langTag, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
    const date = useMemo(
        () => <time dateTime={myDatetime.toISOString()}>{dateStr}</time>,
        [myDatetime, dateStr],
    );

    const hasTime = Boolean(typeof timeStr === 'string' && timeStr.includes(':'));
    if (hasTime) {
        const timeStr = myDatetime.toLocaleTimeString(LOCALE.langTag, {
            hour: '2-digit',
            minute: '2-digit',
        });
        return (
            <>
                {date}
                <time dateTime={myDatetime.toISOString()}>{dateStr}</time>
                <span aria-hidden="true"> | </span>
                <span className="sr-only">&nbsp;at&nbsp;</span>
                <span className="text-nowrap">{timeStr}</span>
            </>
        );
    }

    return dateStr;
};

interface Props extends DatetimesProps {
    size?: 'sm' | 'lg';
    className?: string;
    readingTime?: string;
}

export default function Datetime({ pubDatetime, readingTime, size = 'sm', className }: Props) {
    return (
        <div className={`flex items-center space-x-2 opacity-80 ${className}`}>
            <span className={`${size === 'sm' ? 'text-sm' : 'text-base'}`}>
                <FormattedDatetime pubDatetime={pubDatetime} />
                &nbsp;&nbsp;
                <span>{readingTime}</span>
            </span>
        </div>
    );
}
