import { Fragment, memo, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import { TAdvertsTableRowRenderer, TCurrency, TExchangeRate } from 'types';
import { Badge, BuySellForm, PaymentMethodLabel, StarRating, UserAvatar } from '@/components';
import { ADVERTISER_URL, BUY_SELL } from '@/constants';
import { api } from '@/hooks';
import { useIsAdvertiserBarred, useModalManager } from '@/hooks/custom-hooks';
import { generateEffectiveRate, getCurrentRoute } from '@/utils';
import { LabelPairedChevronRightMdRegularIcon } from '@deriv/quill-icons';
import { useExchangeRates } from '@deriv-com/api-hooks';
import { Localize } from '@deriv-com/translations';
import { Button, Text, useDevice } from '@deriv-com/ui';
import './AdvertsTableRow.scss';

const BASE_CURRENCY = 'USD';

const AdvertsTableRow = memo((props: TAdvertsTableRowRenderer) => {
    const { hideModal, isModalOpenFor, showModal } = useModalManager();
    const { subscribeRates } = useExchangeRates();
    const { isDesktop, isMobile } = useDevice();
    const history = useHistory();
    const isBuySellPage = getCurrentRoute() === 'buy-sell';
    const isAdvertiserBarred = useIsAdvertiserBarred();

    const { data } = api.advertiser.useGetInfo() || {};

    const exchangeRateRef = useRef<TExchangeRate | null>(null);

    const {
        account_currency,
        advertiser_details,
        counterparty_type,
        effective_rate,
        id: advertId,
        local_currency = '',
        max_order_amount_limit_display,
        min_order_amount_limit_display,
        payment_method_names,
        price_display,
        rate,
        rate_type,
    } = props;

    useEffect(() => {
        if (local_currency) {
            exchangeRateRef.current = subscribeRates({
                base_currency: BASE_CURRENCY,
                target_currencies: [local_currency],
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [local_currency]);

    const Container = isMobile ? 'div' : Fragment;

    const { completed_orders_count, id, is_online, name, rating_average, rating_count } = advertiser_details || {};

    const { displayEffectiveRate } = generateEffectiveRate({
        exchangeRate: exchangeRateRef.current?.rates?.[local_currency],
        localCurrency: local_currency as TCurrency,
        marketRate: Number(effective_rate),
        price: Number(price_display),
        rate,
        rateType: rate_type,
    });
    const hasRating = !!rating_average && !!rating_count;
    const isBuyAdvert = counterparty_type === BUY_SELL.BUY;
    const isMyAdvert = data?.id === id;
    const ratingAverageDecimal = rating_average ? Number(rating_average).toFixed(1) : null;
    const textColor = isMobile ? 'less-prominent' : 'general';

    return (
        <div
            className={clsx('adverts-table-row', {
                'adverts-table-row--advertiser': !isBuySellPage,
            })}
        >
            <Container>
                {isBuySellPage && (
                    <div
                        className={clsx('flex gap-4 items-center', {
                            'cursor-pointer': !isAdvertiserBarred,
                        })}
                        onClick={() =>
                            isAdvertiserBarred
                                ? undefined
                                : history.push(`${ADVERTISER_URL}/${id}?currency=${local_currency}`)
                        }
                    >
                        <UserAvatar
                            isOnline={is_online}
                            nickname={name || ''}
                            showOnlineStatus
                            size={25}
                            textSize='xs'
                        />
                        <div className='flex flex-col'>
                            <div
                                className={clsx('flex flex-row items-center gap-2', {
                                    'mb-[-0.5rem]': hasRating,
                                })}
                            >
                                <Text size='sm' weight={isMobile ? 'bold' : 400}>
                                    {name}
                                </Text>
                                <Badge tradeCount={completed_orders_count} />
                            </div>
                            <div className='flex items-center'>
                                {hasRating ? (
                                    <>
                                        <Text className='lg:mr-0' color='less-prominent' size='xs'>
                                            {ratingAverageDecimal}
                                        </Text>
                                        <StarRating
                                            allowFraction
                                            isReadonly
                                            ratingValue={Number(ratingAverageDecimal)}
                                            starsScale={isMobile ? 0.7 : 0.9}
                                        />
                                        <Text className='lg:ml-[-0.5rem] ml-[-2.5rem]' color='less-prominent' size='xs'>
                                            ({rating_count})
                                        </Text>
                                    </>
                                ) : (
                                    <Text color='less-prominent' size='xs'>
                                        <Localize i18n_default_text='Not rated yet' />
                                    </Text>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <Container {...(isMobile && { className: clsx('flex flex-col', { 'mt-3 ml-14': isBuySellPage }) })}>
                    {isMobile && (
                        <Text color={isBuySellPage ? 'general' : 'less-prominent'} size={isBuySellPage ? 'xs' : 'sm'}>
                            Rate (1 USD)
                        </Text>
                    )}
                    <Container {...(isMobile && { className: 'flex flex-col-reverse mb-7' })}>
                        <Text color={textColor} size='sm'>
                            {isMobile && 'Limits:'} {min_order_amount_limit_display}-{max_order_amount_limit_display}{' '}
                            {account_currency}
                        </Text>
                        <Text
                            className='text-wrap w-[90%]'
                            color='success'
                            size={isBuySellPage || isDesktop ? 'sm' : 'md'}
                            weight='bold'
                        >
                            {displayEffectiveRate} {local_currency}
                        </Text>
                    </Container>
                    <div className='flex flex-wrap gap-2'>
                        {payment_method_names ? (
                            payment_method_names.map((method: string, idx: number) => (
                                <PaymentMethodLabel
                                    color={textColor}
                                    key={idx}
                                    paymentMethodName={method}
                                    size={isMobile ? 'sm' : 'xs'}
                                />
                            ))
                        ) : (
                            <PaymentMethodLabel color={textColor} paymentMethodName='-' />
                        )}
                    </div>
                </Container>
            </Container>
            {!isMyAdvert && (
                <div
                    className={clsx('flex relative', {
                        'flex-col h-full justify-center': isBuySellPage,
                        'flex-row justify-end': !isBuySellPage,
                    })}
                >
                    {isMobile && isBuySellPage && (
                        <LabelPairedChevronRightMdRegularIcon className='absolute top-0 right-0' />
                    )}
                    <Button
                        className='lg:w-[7.5rem]'
                        disabled={isAdvertiserBarred}
                        onClick={() => showModal('BuySellForm')}
                        size={isMobile ? 'md' : 'sm'}
                        textSize={isMobile ? 'md' : 'xs'}
                    >
                        {isBuyAdvert ? 'Buy' : 'Sell'} {account_currency}
                    </Button>
                </div>
            )}
            {isModalOpenFor('BuySellForm') && (
                <BuySellForm
                    advertId={advertId}
                    isModalOpen={!!isModalOpenFor('BuySellForm')}
                    onRequestClose={hideModal}
                />
            )}
        </div>
    );
});

AdvertsTableRow.displayName = 'AdvertsTableRow';
export default AdvertsTableRow;
